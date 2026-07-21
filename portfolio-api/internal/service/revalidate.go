package service

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Revalidate fires a best-effort request to the Next.js ISR revalidation endpoint.
// Failures are non-fatal — the page still revalidates on its ISR interval.
func Revalidate(path string) {
	base := os.Getenv("APP_BASE_URL")
	secret := os.Getenv("REVALIDATE_SECRET")
	if base == "" || secret == "" {
		return
	}
	u := fmt.Sprintf("%s/api/revalidate?secret=%s&path=%s",
		base, url.QueryEscape(secret), url.QueryEscape(path))

	go func() {
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Get(u)
		if err == nil {
			_ = resp.Body.Close()
		}
	}()
}
