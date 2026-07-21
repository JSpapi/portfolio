package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/store"
)

type projectOut struct {
	ID          string     `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Tags        []string   `json:"tags"`
	URLLive     *string    `json:"url_live"`
	URLRepo     *string    `json:"url_repo"`
	Featured    bool       `json:"featured"`
	SortOrder   int32      `json:"sort_order"`
	CreatedAt   *time.Time `json:"created_at"`
}

func projectToOut(p store.Project) projectOut {
	tags := p.Tags
	if tags == nil {
		tags = []string{}
	}
	return projectOut{
		ID: p.ID.String(), Slug: p.Slug, Title: p.Title, Description: p.Description,
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
