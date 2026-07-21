package service

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v2"
)

// Email sends the magic-link email via Resend. When RESEND_API_KEY is unset it
// logs the link instead (local dev), so the flow is testable without an account.
type Email struct {
	client *resend.Client
	from   string
}

func NewEmail() *Email {
	key := os.Getenv("RESEND_API_KEY")
	e := &Email{from: os.Getenv("EMAIL_FROM")}
	if e.from == "" {
		e.from = "onboarding@resend.dev"
	}
	if key != "" {
		e.client = resend.NewClient(key)
	}
	return e
}

// Enabled reports whether real email delivery is configured.
func (e *Email) Enabled() bool { return e.client != nil }

// SendMagicLink emails the unlock URL to the visitor. Returns an error only on a
// genuine send failure; when Resend is unconfigured it prints the link and succeeds.
func (e *Email) SendMagicLink(name, to, unlockURL string) error {
	subject := "Your access to the private profile"
	html := fmt.Sprintf(
		`<p>Hi %s,</p>
<p>You've been granted access to my detailed profile page.
Open this link to unlock it (valid for 24 hours, one-time use):</p>
<p><a href="%s">%s</a></p>
<p>If you didn't request this, you can ignore this email.</p>`,
		htmlEscape(name), unlockURL, unlockURL,
	)
	text := fmt.Sprintf(
		"Hi %s,\n\nYou've been granted access to my detailed profile page.\n"+
			"Open this link to unlock it (valid for 24 hours, one-time use):\n\n%s\n\n"+
			"If you didn't request this, you can ignore this email.\n",
		name, unlockURL,
	)

	if !e.Enabled() {
		fmt.Printf("[email:dev] magic link for %s <%s>: %s\n", name, to, unlockURL)
		return nil
	}

	_, err := e.client.Emails.Send(&resend.SendEmailRequest{
		From:    e.from,
		To:      []string{to},
		Subject: subject,
		Html:    html,
		Text:    text,
	})
	return err
}

// htmlEscape escapes the few characters that matter for interpolating a name
// into an HTML body.
func htmlEscape(s string) string {
	repl := map[rune]string{
		'&': "&amp;", '<': "&lt;", '>': "&gt;", '"': "&quot;", '\'': "&#39;",
	}
	out := make([]rune, 0, len(s))
	for _, r := range s {
		if esc, ok := repl[r]; ok {
			out = append(out, []rune(esc)...)
		} else {
			out = append(out, r)
		}
	}
	return string(out)
}
