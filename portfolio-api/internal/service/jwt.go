package service

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims is the admin JWT payload.
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// jwtSecret returns the signing key from env.
func jwtSecret() []byte { return []byte(os.Getenv("JWT_SECRET")) }

// jwtExpiry parses JWT_EXPIRY (default 72h).
func jwtExpiry() time.Duration {
	if d, err := time.ParseDuration(os.Getenv("JWT_EXPIRY")); err == nil && d > 0 {
		return d
	}
	return 72 * time.Hour
}

// IssueAdminJWT signs a token for the given admin user id.
func IssueAdminJWT(userID uuid.UUID) (string, time.Duration, error) {
	exp := jwtExpiry()
	claims := Claims{
		Role: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(exp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret())
	return signed, exp, err
}

// ParseAdminJWT validates a token string and returns its claims.
func ParseAdminJWT(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if claims.Role != "admin" {
		return nil, fmt.Errorf("not an admin token")
	}
	return claims, nil
}
