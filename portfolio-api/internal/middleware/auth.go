package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/axror/portfolio-api/internal/service"
)

// AdminRequired reads the admin JWT from the "token" cookie and aborts with 401
// if it is missing or invalid.
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie("token")
		if err != nil || raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		claims, err := service.ParseAdminJWT(raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Set("user_id", claims.Subject)
		c.Set("role", claims.Role)
		c.Next()
	}
}
