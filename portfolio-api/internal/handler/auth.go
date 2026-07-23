package handler

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/axror/portfolio-api/internal/service"
)

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// cookieSecure reports whether cookies should carry the Secure flag. Defaults to
// true; set COOKIE_INSECURE=1 for local http development.
func cookieSecure() bool {
	return os.Getenv("COOKIE_INSECURE") != "1"
}

// cookieSameSite chooses the SameSite mode. The frontend (Vercel) and API (Fly)
// live on different domains, so the auth/session cookies must ride cross-site
// requests. In production (Secure/HTTPS) that requires SameSite=None. Locally
// (COOKIE_INSECURE=1, plain http) browsers reject None-without-Secure, so we
// fall back to Lax, which is fine because local dev is effectively same-site.
func cookieSameSite() http.SameSite {
	if cookieSecure() {
		return http.SameSiteNoneMode
	}
	return http.SameSiteLaxMode
}

// Login validates credentials and sets the admin JWT cookie.
func (h *Handler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, err := h.Q.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, exp, err := service.IssueAdminJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not issue token"})
		return
	}

	c.SetSameSite(cookieSameSite())
	c.SetCookie("token", token, int(exp.Seconds()), "/", "", cookieSecure(), true)
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "email": user.Email, "role": user.Role})
}

// Logout clears the admin JWT cookie.
func (h *Handler) Logout(c *gin.Context) {
	c.SetSameSite(cookieSameSite())
	c.SetCookie("token", "", -1, "/", "", cookieSecure(), true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Me returns the current admin identity from the validated JWT.
func (h *Handler) Me(c *gin.Context) {
	rawID, _ := c.Get("user_id")
	idStr, _ := rawID.(string)
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, err := h.Q.GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "email": user.Email, "role": user.Role})
}
