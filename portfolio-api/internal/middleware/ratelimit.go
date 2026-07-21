package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// ipLimiter keeps a token-bucket limiter per client IP. It is a lightweight,
// in-memory guard against form spam; the DB-level per-IP count in the handler is
// the durable backstop.
type ipLimiter struct {
	mu       sync.Mutex
	limiters map[string]*entry
	r        rate.Limit
	burst    int
}

type entry struct {
	lim  *rate.Limiter
	seen time.Time
}

func newIPLimiter(perHour int) *ipLimiter {
	if perHour < 1 {
		perHour = 3
	}
	l := &ipLimiter{
		limiters: make(map[string]*entry),
		r:        rate.Every(time.Hour / time.Duration(perHour)),
		burst:    perHour,
	}
	go l.cleanupLoop()
	return l
}

func (l *ipLimiter) get(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()
	e, ok := l.limiters[ip]
	if !ok {
		e = &entry{lim: rate.NewLimiter(l.r, l.burst)}
		l.limiters[ip] = e
	}
	e.seen = time.Now()
	return e.lim
}

func (l *ipLimiter) cleanupLoop() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		l.mu.Lock()
		for ip, e := range l.limiters {
			if time.Since(e.seen) > 2*time.Hour {
				delete(l.limiters, ip)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimitByIP returns middleware that limits requests to perHour per client IP.
func RateLimitByIP(perHour int) gin.HandlerFunc {
	l := newIPLimiter(perHour)
	return func(c *gin.Context) {
		if !l.get(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, try again later"})
			return
		}
		c.Next()
	}
}
