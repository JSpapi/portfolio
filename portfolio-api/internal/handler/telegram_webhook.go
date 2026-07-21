package handler

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// telegramUpdate is the minimal slice of the Bot API update we care about:
// callback queries from the inline Approve/Deny buttons.
type telegramUpdate struct {
	CallbackQuery *struct {
		ID   string `json:"id"`
		Data string `json:"data"`
		From struct {
			Username string `json:"username"`
		} `json:"from"`
		Message struct {
			MessageID int64 `json:"message_id"`
		} `json:"message"`
	} `json:"callback_query"`
}

// TelegramWebhook handles Approve/Deny taps. The secret path segment and the
// X-Telegram-Bot-Api-Secret-Token header are both verified.
func (h *Handler) TelegramWebhook(c *gin.Context) {
	if c.Param("secret") != os.Getenv("TELEGRAM_WEBHOOK_SECRET") {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if hdr := os.Getenv("TELEGRAM_WEBHOOK_SECRET"); hdr != "" {
		if got := c.GetHeader("X-Telegram-Bot-Api-Secret-Token"); got != "" && got != hdr {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "bad secret token"})
			return
		}
	}

	var upd telegramUpdate
	if err := c.ShouldBindJSON(&upd); err != nil || upd.CallbackQuery == nil {
		// Ignore non-callback updates; Telegram just needs a 200.
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	cb := upd.CallbackQuery
	action, idStr, ok := strings.Cut(cb.Data, ":")
	if !ok {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}
	reqID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	msgID := cb.Message.MessageID

	switch action {
	case "approve":
		name, err := h.approveAndEmail(ctx, reqID, "telegram")
		if err != nil {
			_ = h.Telegram.AnswerCallback(ctx, cb.ID, "Approved, but email failed")
			_ = h.Telegram.EditDecision(ctx, msgID,
				"✅ Approved · ⚠️ email failed — resend from /admin/access-requests\n("+name+")")
		} else {
			_ = h.Telegram.AnswerCallback(ctx, cb.ID, "Approved — link emailed")
			_ = h.Telegram.EditDecision(ctx, msgID, "✅ Approved · emailed "+name)
		}
	case "deny":
		by := "telegram"
		if _, err := h.Q.DenyAccessRequest(ctx, denyParams(reqID, by)); err != nil {
			_ = h.Telegram.AnswerCallback(ctx, cb.ID, "Could not deny")
		} else {
			_ = h.Telegram.AnswerCallback(ctx, cb.ID, "Denied")
			_ = h.Telegram.EditDecision(ctx, msgID, "⛔ Denied")
		}
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
