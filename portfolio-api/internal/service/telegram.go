package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// Telegram wraps the minimal Bot API calls we need: send the approval message,
// edit it after a decision, and acknowledge callback queries.
type Telegram struct {
	token  string
	chatID string
	client *http.Client
}

func NewTelegram() *Telegram {
	return &Telegram{
		token:  os.Getenv("TELEGRAM_BOT_TOKEN"),
		chatID: os.Getenv("TELEGRAM_CHAT_ID"),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// Enabled reports whether Telegram is configured. When false, sends are no-ops
// so local dev works without a bot.
func (t *Telegram) Enabled() bool { return t.token != "" && t.chatID != "" }

func (t *Telegram) apiURL(method string) string {
	return fmt.Sprintf("https://api.telegram.org/bot%s/%s", t.token, method)
}

func (t *Telegram) call(ctx context.Context, method string, payload any) (*tgResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.apiURL(method), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := t.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out tgResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if !out.OK {
		return &out, fmt.Errorf("telegram %s failed: %s", method, out.Description)
	}
	return &out, nil
}

type tgResponse struct {
	OK          bool   `json:"ok"`
	Description  string `json:"description"`
	Result      struct {
		MessageID int64 `json:"message_id"`
	} `json:"result"`
}

// SendAccessRequest posts the approval message with inline Approve/Deny buttons.
// callback_data is "approve:<id>" / "deny:<id>". Returns the message id so the
// caller can edit it later.
func (t *Telegram) SendAccessRequest(ctx context.Context, reqID, name, email, reason, ip string) (int64, error) {
	if !t.Enabled() {
		return 0, nil
	}
	text := fmt.Sprintf(
		"🔐 New access request\n\nName: %s\nEmail: %s\nReason: %s\nIP: %s",
		name, email, reason, ip,
	)
	payload := map[string]any{
		"chat_id":                  t.chatID,
		"text":                     text,
		"disable_web_page_preview": true,
		"reply_markup": map[string]any{
			"inline_keyboard": [][]map[string]any{{
				{"text": "✅ Approve", "callback_data": "approve:" + reqID},
				{"text": "⛔ Deny", "callback_data": "deny:" + reqID},
			}},
		},
	}
	resp, err := t.call(ctx, "sendMessage", payload)
	if err != nil {
		return 0, err
	}
	return resp.Result.MessageID, nil
}

// EditDecision replaces the message text and removes the buttons after a decision.
func (t *Telegram) EditDecision(ctx context.Context, messageID int64, text string) error {
	if !t.Enabled() || messageID == 0 {
		return nil
	}
	payload := map[string]any{
		"chat_id":    t.chatID,
		"message_id": messageID,
		"text":       text,
	}
	_, err := t.call(ctx, "editMessageText", payload)
	return err
}

// AnswerCallback acknowledges a callback query (stops the client-side spinner).
func (t *Telegram) AnswerCallback(ctx context.Context, callbackID, text string) error {
	if !t.Enabled() || callbackID == "" {
		return nil
	}
	payload := map[string]any{
		"callback_query_id": callbackID,
		"text":              text,
	}
	_, err := t.call(ctx, "answerCallbackQuery", payload)
	return err
}
