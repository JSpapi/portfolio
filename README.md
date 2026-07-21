# Portfolio

Personal portfolio + engineering blog + a gated private profile page.

- **`portfolio-api/`** — Go + Gin REST API (pgx v5, sqlc, golang-migrate, JWT cookie auth, Cloudflare R2 uploads, Telegram + Resend for the gated flow). Deploys to Fly.io.
- **`portfolio-web/`** — Next.js 15 (App Router, TypeScript, Tailwind) frontend. Deploys to Vercel.
- **`portfolio-spec.md`** — the full technical specification. §20 covers the gated private page.

## The gated private profile (headline feature)

A visitor fills the form at `/request-access` → a Telegram message with **Approve / Deny** buttons lands in your group → tapping **Approve** emails them a single-use magic link → the link sets an `access_session` cookie that unlocks `/private` (detailed CV, project deep-dives, contact/availability, resume + references). Everything is manual and revocable from `/admin/access-requests`.

## Run it locally

### 1. API + Postgres

```bash
cd portfolio-api
cp .env.example .env          # fill in ADMIN_*, JWT_SECRET at minimum
# start a Postgres (docker) and point DATABASE_URL at it, then:
go run ./cmd/server           # migrations run at startup, admin is seeded
```

Or the whole stack via Docker:

```bash
cd portfolio-api
docker compose up --build
```

The API listens on `:8080`. Without `RESEND_API_KEY`, magic links are printed to
the server log instead of emailed — handy for local testing.

### 2. Frontend

```bash
cd portfolio-web
cp .env.example .env.local     # NEXT_PUBLIC_API_URL should point at the API
npm install
npm run dev                    # http://localhost:3000
```

## Deploy

- **API → Fly.io:** `flyctl launch` then set secrets with `flyctl secrets set …`
  (`JWT_SECRET`, `ADMIN_PASSWORD`, `R2_*`, `TELEGRAM_*`, `RESEND_API_KEY`, …).
- **Frontend → Vercel:** import the repo, set `NEXT_PUBLIC_API_URL` and
  `REVALIDATE_SECRET`. Vercel auto-deploys on push to `main`.
- **Telegram webhook:** once the API is public, register it once (see
  `portfolio-spec.md` §20.3).
