package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
)

// AccessRequired validates the access_session cookie against an active, approved
// access request. It authorizes only the private-profile read surface.
func AccessRequired(q *store.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie("access_session")
		if err != nil || raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no access"})
			return
		}
		hash := service.Sha256Hex(raw)
		row, err := q.GetActiveAccessBySession(c.Request.Context(), &hash)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired access"})
			return
		}
		c.Set("access_request_id", row.ID.String())
		c.Next()
	}
}
