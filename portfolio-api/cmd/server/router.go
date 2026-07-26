package main

import (
	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/handler"
	"github.com/axror/portfolio-api/internal/middleware"
	"github.com/axror/portfolio-api/internal/store"
)

// buildRouter wires every route group with its middleware.
func buildRouter(h *handler.Handler, q *store.Queries) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.CORS())

	// Trust only the platform proxy (Fly sets X-Forwarded-For). Configure via env.
	_ = r.SetTrustedProxies(nil)

	rateLimit := 3
	if n, err := strconv.Atoi(os.Getenv("ACCESS_RATE_LIMIT_PER_HOUR")); err == nil && n > 0 {
		rateLimit = n
	}

	r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	api := r.Group("/api")

	// --- Public content ---
	api.GET("/posts", h.ListPosts)
	api.GET("/posts/tags", h.ListTags)
	api.GET("/posts/:slug", h.GetPost)
	api.GET("/projects", h.ListProjects)
	api.GET("/now", h.GetNow)
	api.GET("/feed.rss", h.FeedRSS)

	// --- Auth ---
	api.POST("/auth/login", h.Login)
	api.POST("/auth/logout", h.Logout)
	api.GET("/auth/me", middleware.AdminRequired(), h.Me)

	// --- Gated access flow (public + webhook) ---
	access := api.Group("/access")
	access.POST("/request", middleware.RateLimitByIP(rateLimit), h.RequestAccess)
	access.GET("/unlock", h.Unlock)
	access.POST("/logout", h.AccessLogout)
	access.POST("/telegram/webhook/:secret", h.TelegramWebhook)

	// --- Private profile (gated read) ---
	api.GET("/private/profile", middleware.AccessRequired(q), h.GetPrivateProfile)

	// --- Admin ---
	admin := api.Group("/admin")
	admin.Use(middleware.AdminRequired())
	{
		admin.GET("/posts", h.ListPostsAdmin)
		admin.GET("/posts/:slug", h.GetPostAdmin)
		admin.POST("/posts", h.CreatePost)
		admin.PUT("/posts/:slug", h.UpdatePost)
		admin.PUT("/posts/:slug/publish", h.PublishPost)
		admin.PUT("/posts/:slug/publish-at", h.SetPublishDate)
		admin.PUT("/posts/:slug/unpublish", h.UnpublishPost)
		admin.DELETE("/posts/:slug", h.DeletePost)

		admin.POST("/upload", h.Upload)
		admin.GET("/media", h.ListMedia)
		admin.DELETE("/media/:id", h.DeleteMedia)

		admin.POST("/projects", h.CreateProject)
		admin.PUT("/projects/reorder", h.ReorderProjects)
		admin.PUT("/projects/:slug", h.UpdateProject)
		admin.DELETE("/projects/:slug", h.DeleteProject)

		admin.PUT("/now", h.UpdateNow)

		admin.GET("/access-requests", h.ListAccessRequests)
		admin.POST("/access-requests/:id/approve", h.ApproveAccessRequestAdmin)
		admin.POST("/access-requests/:id/deny", h.DenyAccessRequestAdmin)
		admin.POST("/access-requests/:id/revoke", h.RevokeAccessRequest)

		admin.GET("/private-profile", h.GetPrivateProfileAdmin)
		admin.PUT("/private-profile", h.UpdatePrivateProfileAdmin)
	}

	return r
}
