package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
)

// Title/Description are localized objects: { "en": ..., "ru": ..., "uz": ... }.
type projectWriteReq struct {
	Slug        string          `json:"slug"`
	Title       json.RawMessage `json:"title"`
	Description json.RawMessage `json:"description"`
	Tags        []string        `json:"tags"`
	URLLive     *string         `json:"url_live"`
	URLRepo     *string         `json:"url_repo"`
	Featured    bool            `json:"featured"`
	SortOrder   int32           `json:"sort_order"`
}

// localizedBytes validates a localized field is present, valid JSON; defaults
// missing description to an empty object.
func localizedBytes(raw json.RawMessage, allowEmpty bool) ([]byte, bool) {
	if len(raw) == 0 {
		if allowEmpty {
			return []byte(`{}`), true
		}
		return nil, false
	}
	if !json.Valid(raw) {
		return nil, false
	}
	return []byte(raw), true
}

// CreateProject adds a portfolio project.
func (h *Handler) CreateProject(c *gin.Context) {
	var req projectWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !service.ValidSlug(req.Slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug"})
		return
	}
	title, ok := localizedBytes(req.Title, false)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title required (localized object)"})
		return
	}
	desc, _ := localizedBytes(req.Description, true)
	if req.Tags == nil {
		req.Tags = []string{}
	}
	p, err := h.Q.CreateProject(c.Request.Context(), store.CreateProjectParams{
		Slug: req.Slug, Title: title, Description: desc, Tags: req.Tags,
		UrlLive: req.URLLive, UrlRepo: req.URLRepo, Featured: req.Featured, SortOrder: req.SortOrder,
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "could not create project (slug may exist)"})
		return
	}
	c.JSON(http.StatusCreated, projectToOut(p))
}

// UpdateProject updates a project by slug.
func (h *Handler) UpdateProject(c *gin.Context) {
	slug := c.Param("slug")
	var req projectWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	title, ok := localizedBytes(req.Title, false)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title required (localized object)"})
		return
	}
	desc, _ := localizedBytes(req.Description, true)
	if req.Tags == nil {
		req.Tags = []string{}
	}
	p, err := h.Q.UpdateProject(c.Request.Context(), store.UpdateProjectParams{
		Slug: slug, Title: title, Description: desc, Tags: req.Tags,
		UrlLive: req.URLLive, UrlRepo: req.URLRepo, Featured: req.Featured, SortOrder: req.SortOrder,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update project"})
		return
	}
	c.JSON(http.StatusOK, projectToOut(p))
}

type reorderReq struct {
	IDs []string `json:"ids"`
}

// ReorderProjects sets sort_order from the given id order (0-based).
func (h *Handler) ReorderProjects(c *gin.Context) {
	var req reorderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	for i, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id in list"})
			return
		}
		if err := h.Q.SetProjectSortOrder(c.Request.Context(), store.SetProjectSortOrderParams{
			ID: id, SortOrder: int32(i),
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not reorder"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DeleteProject removes a project by slug.
func (h *Handler) DeleteProject(c *gin.Context) {
	slug := c.Param("slug")
	if err := h.Q.DeleteProject(c.Request.Context(), slug); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete project"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
