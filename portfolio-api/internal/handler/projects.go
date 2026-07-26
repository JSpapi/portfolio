package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/store"
)

// projectOut returns title/description as localized objects: { "en": ..., "ru":
// ..., "uz": ... }. The frontend picks the active language (with fallback).
type projectOut struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Title       json.RawMessage `json:"title"`
	Description json.RawMessage `json:"description"`
	Tags        []string        `json:"tags"`
	URLLive     *string         `json:"url_live"`
	URLRepo     *string         `json:"url_repo"`
	Featured    bool            `json:"featured"`
	SortOrder   int32           `json:"sort_order"`
	CreatedAt   *time.Time      `json:"created_at"`
}

// emptyLocalized is the fallback when a title/description column is somehow null.
var emptyLocalized = json.RawMessage(`{}`)

func localized(b []byte) json.RawMessage {
	if len(b) == 0 {
		return emptyLocalized
	}
	return json.RawMessage(b)
}

// pickLang extracts a single language from a localized field
// ({ "en": ..., "ru": ..., "uz": ... }), preferring `want`, then English, then
// any available value. Used where one plain string is needed (e.g. the RSS
// feed, which is language-agnostic). Falls back to treating b as a plain string.
func pickLang(b []byte, want string) string {
	if len(b) == 0 {
		return ""
	}
	var m map[string]string
	if err := json.Unmarshal(b, &m); err != nil {
		return string(b) // not a JSON object — treat as a plain string
	}
	if v := m[want]; v != "" {
		return v
	}
	if v := m["en"]; v != "" {
		return v
	}
	for _, v := range m {
		if v != "" {
			return v
		}
	}
	return ""
}

func projectToOut(p store.Project) projectOut {
	tags := p.Tags
	if tags == nil {
		tags = []string{}
	}
	return projectOut{
		ID: p.ID.String(), Slug: p.Slug,
		Title: localized(p.Title), Description: localized(p.Description),
		Tags: tags, URLLive: p.UrlLive, URLRepo: p.UrlRepo, Featured: p.Featured,
		SortOrder: p.SortOrder, CreatedAt: tsToPtr(p.CreatedAt),
	}
}

// ListProjects returns all projects, featured first then by sort_order.
func (h *Handler) ListProjects(c *gin.Context) {
	rows, err := h.Q.ListProjects(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list projects"})
		return
	}
	out := make([]projectOut, 0, len(rows))
	for _, p := range rows {
		out = append(out, projectToOut(p))
	}
	c.JSON(http.StatusOK, gin.H{"projects": out})
}
