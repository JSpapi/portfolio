package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/store"
)

type privateProfileOut struct {
	CVMarkdown       string          `json:"cv_markdown"`
	ProjectsMarkdown string          `json:"projects_markdown"`
	ContactMarkdown  string          `json:"contact_markdown"`
	ResumeURL        *string         `json:"resume_url"`
	References       json.RawMessage `json:"references"`
	UpdatedAt        *time.Time      `json:"updated_at"`
}

func privateToOut(p store.PrivateProfile) privateProfileOut {
	refs := json.RawMessage(p.ReferencesJson)
	if len(refs) == 0 {
		refs = json.RawMessage("[]")
	}
	return privateProfileOut{
		CVMarkdown: p.CvMarkdown, ProjectsMarkdown: p.ProjectsMarkdown,
		ContactMarkdown: p.ContactMarkdown, ResumeURL: p.ResumeUrl,
		References: refs, UpdatedAt: tsToPtr(p.UpdatedAt),
	}
}

// GetPrivateProfile (AccessRequired) returns the gated profile content. The
// response is marked no-store so intermediaries never cache privileged content.
func (h *Handler) GetPrivateProfile(c *gin.Context) {
	p, err := h.Q.GetPrivateProfile(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load profile"})
		return
	}
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusOK, privateToOut(p))
}

// --- Admin: edit the private profile content --------------------------------

type privateProfileWriteReq struct {
	CVMarkdown       string          `json:"cv_markdown"`
	ProjectsMarkdown string          `json:"projects_markdown"`
	ContactMarkdown  string          `json:"contact_markdown"`
	ResumeURL        *string         `json:"resume_url"`
	References       json.RawMessage `json:"references"`
}

// GetPrivateProfileAdmin returns the content for editing.
func (h *Handler) GetPrivateProfileAdmin(c *gin.Context) {
	p, err := h.Q.GetPrivateProfile(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load profile"})
		return
	}
	c.JSON(http.StatusOK, privateToOut(p))
}

// UpdatePrivateProfileAdmin saves edited content.
func (h *Handler) UpdatePrivateProfileAdmin(c *gin.Context) {
	var req privateProfileWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	refs := []byte(req.References)
	if len(refs) == 0 {
		refs = []byte("[]")
	} else if !json.Valid(refs) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "references must be valid JSON"})
		return
	}

	p, err := h.Q.UpdatePrivateProfile(c.Request.Context(), store.UpdatePrivateProfileParams{
		CvMarkdown:       req.CVMarkdown,
		ProjectsMarkdown: req.ProjectsMarkdown,
		ContactMarkdown:  req.ContactMarkdown,
		ResumeUrl:        req.ResumeURL,
		ReferencesJson:   refs,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update profile"})
		return
	}
	c.JSON(http.StatusOK, privateToOut(p))
}
