package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetNow returns the "currently working on" widget content.
func (h *Handler) GetNow(c *gin.Context) {
	n, err := h.Q.GetNow(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get now"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"body": n.Body, "updated_at": tsToPtr(n.UpdatedAt)})
}

type updateNowReq struct {
	Body string `json:"body"`
}

// UpdateNow (admin) sets the single now row's body.
func (h *Handler) UpdateNow(c *gin.Context) {
	var req updateNowReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	n, err := h.Q.UpdateNow(c.Request.Context(), req.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update now"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"body": n.Body, "updated_at": tsToPtr(n.UpdatedAt)})
}
