package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/axror/portfolio-api/internal/store"
	"github.com/axror/portfolio-api/internal/upload"
)

const (
	maxImageBytes = 10 << 20 // 10 MB
	maxVideoBytes = 50 << 20 // 50 MB
)

var (
	allowedImage = map[string]bool{
		"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true,
	}
	allowedVideo = map[string]bool{"video/mp4": true}
)

// Upload streams a multipart file to R2 and records a media row. The file bytes
// are passed straight from the multipart reader to PutObject — never buffered to
// disk.
func (h *Handler) Upload(c *gin.Context) {
	if h.R2 == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "media storage not configured"})
		return
	}
	slug := strings.TrimSpace(c.PostForm("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug required"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	mime := fileHeader.Header.Get("Content-Type")
	isImage := allowedImage[mime]
	isVideo := allowedVideo[mime]
	if !isImage && !isVideo {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "unsupported file type"})
		return
	}
	if isImage && fileHeader.Size > maxImageBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "image exceeds 10MB"})
		return
	}
	if isVideo && fileHeader.Size > maxVideoBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "video exceeds 50MB"})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not read file"})
		return
	}
	defer src.Close()

	key := upload.Key(slug, fileHeader.Filename, time.Now().Unix())
	if err := h.R2.Put(c.Request.Context(), key, mime, src); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "upload to storage failed"})
		return
	}
	url := h.R2.PublicURL(key)

	// Link the media row to the post if the slug maps to one; otherwise leave
	// post_id NULL (e.g. the reserved private/resume slug).
	var postID *uuid.UUID
	if p, err := h.Q.GetPostBySlug(c.Request.Context(), slug); err == nil {
		id := p.ID
		postID = &id
	}

	if _, err := h.Q.CreateMedia(c.Request.Context(), store.CreateMediaParams{
		PostID:    postID,
		R2Key:     key,
		Url:       url,
		MimeType:  mime,
		SizeBytes: fileHeader.Size,
	}); err != nil {
		// Roll back the R2 object so we don't orphan it.
		_ = h.R2.Delete(c.Request.Context(), key)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not record media"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url, "mime_type": mime, "size_bytes": fileHeader.Size})
}

// ListMedia lists media attached to a post.
func (h *Handler) ListMedia(c *gin.Context) {
	slug := c.Query("post_slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "post_slug required"})
		return
	}
	rows, err := h.Q.ListMediaByPostSlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list media"})
		return
	}
	out := make([]gin.H, 0, len(rows))
	for _, m := range rows {
		out = append(out, gin.H{
			"id": m.ID, "url": m.Url, "mime_type": m.MimeType,
			"size_bytes": m.SizeBytes, "uploaded_at": tsToPtr(m.UploadedAt),
		})
	}
	c.JSON(http.StatusOK, gin.H{"media": out})
}

// DeleteMedia removes a media row and its R2 object.
func (h *Handler) DeleteMedia(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	m, err := h.Q.GetMediaByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := h.Q.DeleteMediaByID(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete media"})
		return
	}
	if h.R2 != nil {
		_ = h.R2.Delete(c.Request.Context(), m.R2Key)
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
