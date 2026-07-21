package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/axror/portfolio-api/internal/store"
)

// denyParams builds the DenyAccessRequest params (shared with the webhook).
func denyParams(id uuid.UUID, by string) store.DenyAccessRequestParams {
	return store.DenyAccessRequestParams{ID: id, DecidedBy: &by}
}

type accessRequestOut struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email"`
	Reason        string     `json:"reason"`
	Status        string     `json:"status"`
	HasSession    bool       `json:"has_active_session"`
	CreatedAt     *time.Time `json:"created_at"`
	DecidedAt     *time.Time `json:"decided_at"`
	DecidedBy     string     `json:"decided_by"`
}

func accessToOut(r store.AccessRequest) accessRequestOut {
	active := r.SessionHash != nil && r.SessionExpiresAt.Valid && r.SessionExpiresAt.Time.After(time.Now())
	return accessRequestOut{
		ID: r.ID.String(), Name: r.Name, Email: r.Email, Reason: r.Reason,
		Status: string(r.Status), HasSession: active,
		CreatedAt: tsToPtr(r.CreatedAt), DecidedAt: tsToPtr(r.DecidedAt), DecidedBy: strDeref(r.DecidedBy),
	}
}

// ListAccessRequests (admin) returns access requests, optionally filtered by status.
func (h *Handler) ListAccessRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	const limit = 50
	offset := (page - 1) * limit

	var status *store.AccessStatus
	if s := c.Query("status"); s != "" {
		st := store.AccessStatus(s)
		status = &st
	}

	rows, err := h.Q.ListAccessRequests(c.Request.Context(), store.ListAccessRequestsParams{
		Limit: limit, Offset: int32(offset), Status: status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list requests"})
		return
	}
	out := make([]accessRequestOut, 0, len(rows))
	for _, r := range rows {
		out = append(out, accessToOut(r))
	}
	c.JSON(http.StatusOK, gin.H{"requests": out, "page": page})
}

// ApproveAccessRequestAdmin mirrors tapping Approve in Telegram.
func (h *Handler) ApproveAccessRequestAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if _, err := h.approveAndEmail(c.Request.Context(), id, "admin-ui"); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "approved but email failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DenyAccessRequestAdmin marks a request denied.
func (h *Handler) DenyAccessRequestAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if _, err := h.Q.DenyAccessRequest(c.Request.Context(), denyParams(id, "admin-ui")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not deny"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// RevokeAccessRequest kills an active session immediately.
func (h *Handler) RevokeAccessRequest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if _, err := h.Q.RevokeAccessRequest(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not revoke"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
