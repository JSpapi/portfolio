package service

import (
	"math"
	"regexp"
	"strings"
)

var slugRe = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// ComputeReadingTime estimates minutes to read, at ~200 words/min, min 1.
func ComputeReadingTime(body string) int {
	words := len(strings.Fields(body))
	minutes := int(math.Ceil(float64(words) / 200.0))
	if minutes < 1 {
		return 1
	}
	return minutes
}

// ValidSlug reports whether s is a safe URL slug (lowercase, digits, single hyphens).
func ValidSlug(s string) bool {
	return len(s) > 0 && len(s) <= 200 && slugRe.MatchString(s)
}

// Slugify best-effort converts an arbitrary string into a valid slug.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 200 {
		s = s[:200]
	}
	return s
}
