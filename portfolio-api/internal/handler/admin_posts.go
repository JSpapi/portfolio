package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
)

// GetPostAdmin returns a single post (including drafts) with its full body.
func (h *Handler) GetPostAdmin(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.Q.GetPostBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get post"})
		return
	}
	detail := postDetail{
		postSummary: summaryFromRow(p.ID.String(), p.Slug, string(p.Type), p.Title, p.Summary,
			p.Tags, p.ReadingTime, tsToPtr(p.PublishedAt), tsToPtr(p.CreatedAt), tsToPtr(p.UpdatedAt)),
		Body: p.Body,
	}
	c.JSON(http.StatusOK, detail)
}

// ListPostsAdmin returns all posts including drafts.
func (h *Handler) ListPostsAdmin(c *gin.Context) {
	rows, err := h.Q.ListAllPostsAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list posts"})
		return
	}
	out := make([]postSummary, 0, len(rows))
	for _, p := range rows {
		out = append(out, summaryFromRow(p.ID.String(), p.Slug, string(p.Type), p.Title, p.Summary,
			p.Tags, p.ReadingTime, tsToPtr(p.PublishedAt), tsToPtr(p.CreatedAt), tsToPtr(p.UpdatedAt)))
	}
	c.JSON(http.StatusOK, gin.H{"posts": out})
}

type postWriteReq struct {
	Slug    string   `json:"slug"`
	Type    string   `json:"type"`
	Title   string   `json:"title"`
	Summary string   `json:"summary"`
	Body    string   `json:"body"`
	Tags    []string `json:"tags"`
}

func validType(t string) bool {
	switch store.PostType(t) {
	case store.PostTypeWeekly, store.PostTypeDaily, store.PostTypeDeepDive, store.PostTypeTil:
		return true
	}
	return false
}

// CreatePost creates a draft post.
func (h *Handler) CreatePost(c *gin.Context) {
	var req postWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !service.ValidSlug(req.Slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug"})
		return
	}
	if req.Type == "" {
		req.Type = string(store.PostTypeWeekly)
	}
	if !validType(req.Type) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type"})
		return
	}
	if req.Title == "" || req.Summary == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and summary required"})
		return
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}

	p, err := h.Q.CreatePost(c.Request.Context(), store.CreatePostParams{
		Slug:        req.Slug,
		Type:        store.PostType(req.Type),
		Title:       req.Title,
		Summary:     req.Summary,
		Body:        req.Body,
		Tags:        req.Tags,
		ReadingTime: int32(service.ComputeReadingTime(req.Body)),
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "could not create post (slug may already exist)"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"slug": p.Slug})
}

// UpdatePost updates an existing post's fields.
func (h *Handler) UpdatePost(c *gin.Context) {
	slug := c.Param("slug")
	var req postWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if req.Type == "" {
		req.Type = string(store.PostTypeWeekly)
	}
	if !validType(req.Type) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type"})
		return
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}

	p, err := h.Q.UpdatePost(c.Request.Context(), store.UpdatePostParams{
		Slug:        slug,
		Type:        store.PostType(req.Type),
		Title:       req.Title,
		Summary:     req.Summary,
		Body:        req.Body,
		Tags:        req.Tags,
		ReadingTime: int32(service.ComputeReadingTime(req.Body)),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update post"})
		return
	}
	// If already published, refresh the static page.
	if p.PublishedAt.Valid {
		service.Revalidate("/blog/" + p.Slug)
	}
	c.JSON(http.StatusOK, gin.H{"slug": p.Slug})
}

// PublishPost sets published_at and triggers ISR revalidation.
func (h *Handler) PublishPost(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.Q.PublishPost(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not publish"})
		return
	}
	service.Revalidate("/blog/" + p.Slug)
	service.Revalidate("/blog")
	c.JSON(http.StatusOK, gin.H{"slug": p.Slug, "published_at": tsToPtr(p.PublishedAt)})
}

// UnpublishPost clears published_at (back to draft).
func (h *Handler) UnpublishPost(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.Q.UnpublishPost(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not unpublish"})
		return
	}
	service.Revalidate("/blog/" + p.Slug)
	service.Revalidate("/blog")
	c.JSON(http.StatusOK, gin.H{"slug": p.Slug})
}

// DeletePost deletes a post, its media rows (cascade), and the R2 objects.
func (h *Handler) DeletePost(c *gin.Context) {
	slug := c.Param("slug")

	// Collect R2 keys before the cascade deletes the media rows.
	keys, err := h.Q.ListMediaKeysByPostSlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not enumerate media"})
		return
	}
	if err := h.Q.DeletePost(c.Request.Context(), slug); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete post"})
		return
	}
	// Best-effort R2 cleanup (post row is already gone).
	if h.R2 != nil {
		for _, k := range keys {
			_ = h.R2.Delete(c.Request.Context(), k)
		}
	}
	service.Revalidate("/blog")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
