package service

import (
	"encoding/json"
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

// ReadingTimeFromLocalized computes a single reading-time estimate from a
// localized body ({ "en": ..., "ru": ..., "uz": ... }). Reading time is kept as
// one scalar rather than per-language (it's a rough estimate); we base it on the
// longest language variant so it reflects the fullest version and still works
// when only one language is filled in. Falls back to treating the input as a
// plain string body if it isn't a JSON object.
func ReadingTimeFromLocalized(raw []byte) int {
	if len(raw) == 0 {
		return 1
	}
	var langs map[string]string
	if err := json.Unmarshal(raw, &langs); err != nil {
		// Not a JSON object — treat the raw bytes as a plain body.
		return ComputeReadingTime(string(raw))
	}
	longest := ""
	for _, v := range langs {
		if len(v) > len(longest) {
			longest = v
		}
	}
	return ComputeReadingTime(longest)
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
