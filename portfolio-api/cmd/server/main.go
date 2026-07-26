package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	dbpkg "github.com/axror/portfolio-api/db"
	"github.com/axror/portfolio-api/internal/handler"
	"github.com/axror/portfolio-api/internal/service"
	"github.com/axror/portfolio-api/internal/store"
	"github.com/axror/portfolio-api/internal/upload"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET is required")
	}

	if err := runMigrations(dbURL); err != nil {
		log.Fatalf("migrations failed: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping failed: %v", err)
	}

	q := store.New(pool)

	if err := seedAdmin(ctx, q); err != nil {
		log.Fatalf("admin seed failed: %v", err)
	}

	// R2 is optional in dev — the app boots without it, media upload returns 503.
	var r2 *upload.Client
	if os.Getenv("R2_ACCOUNT_ID") != "" {
		if r2, err = upload.New(ctx); err != nil {
			log.Printf("warning: R2 init failed, media disabled: %v", err)
			r2 = nil
		}
	} else {
		log.Println("R2 not configured — media upload endpoints will return 503")
	}

	h := handler.New(q, pool, r2, service.NewTelegram(), service.NewEmail())

	r := buildRouter(h, q)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second, // uploads can be slow
	}
	log.Printf("listening on :%s", port)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

// runMigrations applies embedded up-migrations at startup.
func runMigrations(dbURL string) error {
	src, err := iofs.New(dbpkg.MigrationsFS, "migrations")
	if err != nil {
		return err
	}
	// golang-migrate's pgx driver expects a "pgx5://" URL scheme.
	migrateURL := dbURL
	if strings.HasPrefix(migrateURL, "postgres://") {
		migrateURL = "pgx5://" + strings.TrimPrefix(migrateURL, "postgres://")
	} else if strings.HasPrefix(migrateURL, "postgresql://") {
		migrateURL = "pgx5://" + strings.TrimPrefix(migrateURL, "postgresql://")
	}
	m, err := migrate.NewWithSourceInstance("iofs", src, migrateURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	log.Println("migrations up to date")
	return nil
}

// seedAdmin inserts the single admin from env, if not present.
func seedAdmin(ctx context.Context, q *store.Queries) error {
	email := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))
	pass := os.Getenv("ADMIN_PASSWORD")
	if email == "" || pass == "" {
		log.Println("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed")
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), 12)
	if err != nil {
		return err
	}
	return q.SeedAdmin(ctx, store.SeedAdminParams{Email: email, PasswordHash: string(hash)})
}
