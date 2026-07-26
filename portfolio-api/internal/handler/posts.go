package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/axror/portfolio-api/internal/store"
)

// postSummary is the list-page shape (no body). Title & summary are localized
// objects { "en": ..., "ru": ..., "uz": ... }; the frontend picks the active
// language (with fallback).
type postSummary struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Type        string          `json:"type"`
	Title       json.RawMessage `json:"title"`
	Summary     json.RawMessage `json:"summary"`
	Tags        []string        `json:"tags"`
	ReadingTime int32           `json:"reading_time"`
	PublishedAt *time.Time      `json:"published_at"`
	CreatedAt   *time.Time      `json:"created_at"`
	UpdatedAt   *time.Time      `json:"updated_at"`
}

// postDetail is the full post including the localized body.
type postDetail struct {
	postSummary
	Body json.RawMessage `json:"body"`
}

func summaryFromRow(id, slug, typ string, title, summary []byte, tags []string, rt int32, pub, created, updated *time.Time) postSummary {
	if tags == nil {
		tags = []string{}
	}
	return postSummary{
		ID: id, Slug: slug, Type: typ, Title: localized(title), Summary: localized(summary),
		Tags: tags, ReadingTime: rt, PublishedAt: pub, CreatedAt: created, UpdatedAt: updated,
	}
}

// ListPosts returns a paginated list of published posts.
func (h *Handler) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	var typeFilter *store.PostType
	if t := c.Query("type"); t != "" {
		pt := store.PostType(t)
		typeFilter = &pt
	}
	var tagFilter *string
	if tag := c.Query("tag"); tag != "" {
		tagFilter = &tag
	}

	rows, err := h.Q.ListPublishedPosts(c.Request.Context(), store.ListPublishedPostsParams{
		Limit: int32(limit), Offset: int32(offset), Type: typeFilter, Tag: tagFilter,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list posts"})
		return
	}
	total, _ := h.Q.CountPublishedPosts(c.Request.Context(), store.CountPublishedPostsParams{
		Type: typeFilter, Tag: tagFilter,
	})

	out := make([]postSummary, 0, len(rows))
	for _, p := range rows {
		out = append(out, summaryFromRow(p.ID.String(), p.Slug, string(p.Type), p.Title, p.Summary,
			p.Tags, p.ReadingTime, tsToPtr(p.PublishedAt), tsToPtr(p.CreatedAt), tsToPtr(p.UpdatedAt)))
	}
	c.JSON(http.StatusOK, gin.H{
		"posts": out,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// GetPost returns a single published post with its body.
func (h *Handler) GetPost(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.Q.GetPublishedPostBySlug(c.Request.Context(), slug)
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
		Body: localized(p.Body),
	}
	c.JSON(http.StatusOK, detail)
}

// ListTags returns a tag cloud with counts.
func (h *Handler) ListTags(c *gin.Context) {
	rows, err := h.Q.TagCounts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get tags"})
		return
	}
	out := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		out = append(out, gin.H{"tag": r.Tag, "count": r.Count})
	}
	c.JSON(http.StatusOK, gin.H{"tags": out})
}
