// Package handler holds the Gin HTTP handlers. Handlers are grouped by resource
// and share a single Handler struct carrying the DB queries, pgx pool (for
// transactions), and the R2/Telegram/email services.
package handler

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
	"github.com/axror/portfolio-api/internal/upload"
)

// Handler bundles every dependency the HTTP handlers need.
type Handler struct {
	Q        *store.Queries
	Pool     *pgxpool.Pool
	R2       *upload.Client
	Telegram *service.Telegram
	Email    *service.Email
}

// New builds a Handler.
func New(q *store.Queries, pool *pgxpool.Pool, r2 *upload.Client, tg *service.Telegram, em *service.Email) *Handler {
	return &Handler{Q: q, Pool: pool, R2: r2, Telegram: tg, Email: em}
}

// tsToPtr converts a pgtype.Timestamptz to a *time.Time for clean JSON output.
func tsToPtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}

// tsFrom builds a valid pgtype.Timestamptz from a time.Time.
func tsFrom(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

// strDeref returns the pointed-to string or "".
func strDeref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
