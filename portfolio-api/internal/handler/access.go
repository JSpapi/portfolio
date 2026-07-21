package handler

import (
	"context"
	"fmt"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
)

// --- Public: submit an access request ---------------------------------------

type accessRequestReq struct {
	Name   string `json:"name"`
	Email  string `json:"email"`
	Reason string `json:"reason"`
}

func magicExpiry() time.Duration {
	if d, err := time.ParseDuration(os.Getenv("ACCESS_MAGIC_EXPIRY")); err == nil && d > 0 {
		return d
	}
	return 24 * time.Hour
}

func sessionExpiry() time.Duration {
	if d, err := time.ParseDuration(os.Getenv("ACCESS_SESSION_EXPIRY")); err == nil && d > 0 {
		return d
	}
	return 720 * time.Hour // 30 days
}

// RequestAccess accepts the public form, records a pending request, and pings
// Telegram. It always returns a generic OK so submissions can't be enumerated.
func (h *Handler) RequestAccess(c *gin.Context) {
	var req accessRequestReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Reason = strings.TrimSpace(req.Reason)

	if req.Name == "" || len(req.Name) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name required"})
		return
	}
	if _, err := mail.ParseAddress(req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valid email required"})
		return
	}
	if len(req.Reason) > 2000 {
		req.Reason = req.Reason[:2000]
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	// Durable per-IP backstop (in addition to the middleware limiter).
	if ip != "" {
		interval := pgtype.Interval{Microseconds: int64(time.Hour / time.Microsecond), Valid: true}
		if n, err := h.Q.CountRecentRequestsByIP(c.Request.Context(), store.CountRecentRequestsByIPParams{
			Ip: &ip, Column2: interval,
		}); err == nil && n >= 10 {
			// Silently accept to avoid signaling the limit, but do nothing more.
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
	}

	ipPtr, uaPtr := &ip, &ua
	row, err := h.Q.CreateAccessRequest(c.Request.Context(), store.CreateAccessRequestParams{
		Name: req.Name, Email: req.Email, Reason: req.Reason, Ip: ipPtr, UserAgent: uaPtr,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not submit request"})
		return
	}

	// Fire the Telegram notification (best effort) and store the message id.
	go func(reqID uuid.UUID, name, email, reason, ip string) {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		msgID, err := h.Telegram.SendAccessRequest(ctx, reqID.String(), name, email, reason, ip)
		if err == nil && msgID != 0 {
			_ = h.Q.SetAccessTelegramMsgID(ctx, store.SetAccessTelegramMsgIDParams{
				ID: reqID, TelegramMsgID: &msgID,
			})
		}
	}(row.ID, req.Name, req.Email, req.Reason, ip)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// --- Shared approval logic (used by Telegram webhook and admin UI) ----------

// approveAndEmail generates a magic link, persists its hash, and emails the
// visitor. decidedBy is "telegram" or "admin-ui". Returns the visitor name for
// message text.
func (h *Handler) approveAndEmail(ctx context.Context, reqID uuid.UUID, decidedBy string) (string, error) {
	rawToken, err := service.NewToken()
	if err != nil {
		return "", err
	}
	hash := service.Sha256Hex(rawToken)
	expires := tsFrom(time.Now().Add(magicExpiry()))

	row, err := h.Q.ApproveAccessRequest(ctx, store.ApproveAccessRequestParams{
		ID: reqID, MagicTokenHash: &hash, MagicExpiresAt: expires, DecidedBy: &decidedBy,
	})
	if err != nil {
		return "", err
	}

	base := os.Getenv("APP_BASE_URL")
	unlockURL := fmt.Sprintf("%s/private/unlock?token=%s", base, rawToken)
	if err := h.Email.SendMagicLink(row.Name, row.Email, unlockURL); err != nil {
		return row.Name, fmt.Errorf("email failed: %w", err)
	}
	return row.Name, nil
}

// --- Public: consume the magic link -----------------------------------------

// Unlock validates the magic token, marks it used, mints a session, and sets the
// access_session cookie.
func (h *Handler) Unlock(c *gin.Context) {
	rawToken := c.Query("token")
	if rawToken == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "missing token"})
		return
	}
	hash := service.Sha256Hex(rawToken)
	row, err := h.Q.GetApprovedByMagicHash(c.Request.Context(), &hash)
	if err != nil {
		// Either never valid, already used, or expired.
		c.JSON(http.StatusGone, gin.H{"error": "link is invalid, used, or expired"})
		return
	}

	rawSession, err := service.NewToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	sessHash := service.Sha256Hex(rawSession)
	sessExpiry := sessionExpiry()

	if _, err := h.Q.ConsumeMagicAndCreateSession(c.Request.Context(), store.ConsumeMagicAndCreateSessionParams{
		ID:               row.ID,
		SessionHash:      &sessHash,
		SessionExpiresAt: tsFrom(time.Now().Add(sessExpiry)),
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("access_session", rawSession, int(sessExpiry.Seconds()), "/", "", cookieSecure(), true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// AccessLogout clears the access session cookie and DB session hash.
func (h *Handler) AccessLogout(c *gin.Context) {
	if raw, err := c.Cookie("access_session"); err == nil && raw != "" {
		hash := service.Sha256Hex(raw)
		_ = h.Q.ClearSessionByHash(c.Request.Context(), &hash)
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("access_session", "", -1, "/", "", cookieSecure(), true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
