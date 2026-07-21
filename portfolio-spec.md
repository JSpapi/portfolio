# Portfolio Web App — Full Technical Specification

> Personal developer portfolio with a public-facing blog that supports rich content:
> text (Markdown), embedded images, and short mp4 video demos — all stored in Cloudflare R2.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Stack](#2-stack)
3. [Architecture](#3-architecture)
4. [Pages and features](#4-pages-and-features)
5. [Blog content model](#5-blog-content-model)
6. [Media pipeline](#6-media-pipeline)
7. [Auth model](#7-auth-model)
8. [Database schema](#8-database-schema)
9. [Cloudflare R2 setup](#9-cloudflare-r2-setup)
10. [API endpoints](#10-api-endpoints)
11. [Markdown rendering](#11-markdown-rendering)
12. [Environment variables](#12-environment-variables)
13. [Go project structure](#13-go-project-structure)
14. [Next.js project structure](#14-nextjs-project-structure)
15. [Go dependencies](#15-go-dependencies)
16. [Next.js dependencies](#16-nextjs-dependencies)
17. [CI/CD pipeline](#17-cicd-pipeline)
18. [Build order](#18-build-order)
19. [Key design decisions](#19-key-design-decisions)
20. [Gated private profile page (access-request flow)](#20-gated-private-profile-page-access-request-flow)

---

## 1. Project overview

A self-hosted, production-quality personal portfolio that:

- Presents your profile, skills, and project work to recruiters and engineers worldwide
- Hosts a public engineering blog where you post daily/weekly work summaries with rich content — Markdown text, images, and short mp4 screen recordings
- Has a single **admin** role (you) that unlocks a private editor UI for writing posts and uploading media
- Requires no CMS dependency — you write in a built-in Markdown editor in the dashboard, drag-drop media, and publish
- Is fully statically renderable for blog content (Next.js SSG/ISR) for fast global load times
- Has a **gated private profile page** with deep career/project/contact detail, unlocked only for approved visitors (HR, close contacts) via an access-request form → Telegram approval → emailed magic link (see [§20](#20-gated-private-profile-page-access-request-flow))
- Serves as a living portfolio proof of Go backend skills for international job applications

---

## 2. Stack

| Layer | Choice | Hosting |
|---|---|---|
| Backend API | Go + Gin | Fly.io |
| Database | PostgreSQL + sqlc + pgx v5 | Supabase (free) or Fly.io |
| Migrations | golang-migrate | runs at startup |
| Media storage | Cloudflare R2 (S3-compatible) | Cloudflare (free egress) |
| Frontend | Next.js 14+ + TypeScript | Vercel |
| Styling | Tailwind CSS + shadcn/ui | — |
| Blog rendering | react-markdown + custom renderers | — |
| Auth | JWT (httpOnly cookie) via golang-jwt | — |
| Gated-page access | Access-request form + Telegram Bot approval + emailed magic-link session cookie | — |
| Transactional email | Resend (magic-link delivery) — swappable for any SMTP | Resend (free tier) |
| Approval notifications | Telegram Bot API (inline Approve/Deny buttons + webhook) | Telegram |
| CI/CD | GitHub Actions | — |
| Local dev | Docker + Docker Compose | — |

---

## 3. Architecture

```
Browser (Next.js on Vercel)
│
├── / (homepage)          SSG — rebuilt on deploy
├── /about                SSG
├── /projects             SSG
├── /blog                 ISR — revalidates every 60s
├── /blog/[slug]          ISR — revalidates on publish
├── /request-access       SSG — access-request form (public)
├── /private              SSR — gated; requires magic-link session cookie
└── /admin/*              Client-side only, JWT-gated
         │
         │  REST API calls (JSON)
         ▼
Go / Gin API (Fly.io — single binary)
         │
    ┌────┼──────────────┬──────────────┬──────────────┐
    │    │              │              │              │
PostgreSQL    Cloudflare R2    Telegram Bot    Resend (email)
(posts,       (images,          (approve/deny   (magic-link
 projects,     videos)           notifications   delivery to
 media,                          + webhook)       visitor)
 users,
 access_requests)
```

**Key principle:** The Go API does not render HTML. It is a pure JSON REST API. Next.js handles all rendering. The admin editor UI lives inside Next.js at `/admin/*`, protected by a client-side JWT check that redirects to `/admin/login` if no valid cookie is found.

---

## 4. Pages and features

### Public pages (no auth required)

| Route | Rendering | Description |
|---|---|---|
| `/` | SSG | Hero section, short bio, "Currently working on" widget, latest 3 posts |
| `/about` | SSG | Full bio, skills grid, timeline, contact links |
| `/projects` | SSG | Grid of portfolio projects with tech tags, links, descriptions |
| `/blog` | ISR (60s) | Paginated post list with type badge, reading time, summary |
| `/blog/[slug]` | ISR | Full post: Markdown rendered with inline images and video players |
| `/blog/tags/[tag]` | ISR | Filtered post list by tag |
| `/request-access` | SSG | Access-request form (name, email, reason) → submits to API → Telegram alert. Shows a "we'll email you when approved" confirmation. See [§20](#20-gated-private-profile-page-access-request-flow) |

### Gated page (magic-link session cookie required — redirects to `/request-access` if no valid access)

| Route | Rendering | Description |
|---|---|---|
| `/private` | SSR | Detailed CV/career history, deep project breakdowns, contact + salary/availability, downloadable resume + references. Content gated behind `access_session` cookie |
| `/private/unlock` | SSR | Landing route for the emailed magic link (`?token=…`). Validates token, sets `access_session` cookie, redirects to `/private` |

### Admin pages (JWT required — redirects to `/admin/login` if not authenticated)

| Route | Description |
|---|---|
| `/admin/login` | Email + password form → sets httpOnly JWT cookie |
| `/admin` | Dashboard: post list, stats, quick actions |
| `/admin/posts/new` | Markdown editor + media uploader — create new post |
| `/admin/posts/[slug]/edit` | Edit existing post, manage attached media |
| `/admin/projects` | Add / edit / reorder portfolio projects |
| `/admin/now` | Edit the "Currently working on" widget text |
| `/admin/access-requests` | List all access requests (pending/approved/denied). Approve/deny from the browser as a fallback to the Telegram buttons; see who currently holds access and revoke it |

### "Currently working on" widget

A single-row widget on the homepage, pulled from `GET /api/now`. One DB row — you update it from the admin panel whenever your focus changes. Shows visitors you are actively building.

---

## 5. Blog content model

### Post types

| Type | Slug prefix | Use case |
|---|---|---|
| `weekly` | `week-NN-` | Weekly summary of what you built and learned |
| `daily` | `YYYY-MM-DD-` | Short daily log — decisions, blockers, progress |
| `deep-dive` | free-form | In-depth technical write-up on a specific topic |
| `til` | `til-` | "Today I Learned" — a single focused insight |

### Post writing structure (recommended per post)

Each post body is Markdown. Use this structure for consistency:

```markdown
## What I was working on
Context — what feature or problem, why it existed.

## What I tried
The approach, the dead ends, the reasoning behind decisions.
Include code snippets here with fenced code blocks.

## What actually worked
The solution. Embed screenshots or screen recordings here using
standard Markdown image syntax — URLs point to your R2 bucket.

![Screenshot of the working UI](https://r2.yourdomain.com/posts/week-14/screenshot.png)

For videos, use an HTML video tag inside the Markdown body:

<video controls width="100%" preload="metadata">
  <source src="https://r2.yourdomain.com/posts/week-14/demo.mp4" type="video/mp4">
</video>

## What I learned / What's next
Takeaways, open questions, plan for next session.
```

---

## 6. Media pipeline

### Upload flow (admin editor)

```
Admin drags image or mp4 into editor
      │
      ▼
Frontend sends multipart/form-data to POST /api/admin/upload
      │
      ▼
Go streams file bytes directly to Cloudflare R2
(never written to local disk — streamed in memory)
      │
      ▼
Go inserts row into media table: { post_id, r2_key, url, mime_type, size_bytes }
      │
      ▼
Go returns { url, mime_type, size_bytes } to frontend
      │
      ▼
Frontend inserts into Markdown body:
  - image → ![filename](url)
  - mp4   → <video controls><source src="url" type="video/mp4"></video>
```

### R2 bucket structure

```
r2-bucket/
└── posts/
    └── {slug}/
        ├── screenshot-1.png
        ├── diagram.webp
        └── demo.mp4
```

### Constraints

| Constraint | Value |
|---|---|
| Max image size | 10 MB |
| Max video size | 50 MB |
| Accepted image types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Accepted video types | `video/mp4` |
| R2 key format | `posts/{slug}/{filename}-{unix_timestamp}.{ext}` |
| Public access | R2 bucket served via Cloudflare public domain |

### Media cleanup

When a post is deleted, Go also calls `DeleteObject` on every R2 key linked to that post via the `media` table. Orphaned media is prevented by always inserting the `media` row in the same DB transaction as the upload response.

---

## 7. Auth model

### Admin — single account

- One user, seeded into the DB at startup via `ON CONFLICT DO NOTHING`
- Credentials stored in env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Login: `POST /api/auth/login { email, password }` → sets `httpOnly; Secure; SameSite=Strict` JWT cookie
- All `/api/admin/*` routes require `AdminRequired` middleware
- JWT payload: `{ "sub": "user-uuid", "role": "admin", "exp": unix_timestamp }`
- Expiry: 72h, configurable via `JWT_EXPIRY`

### Two independent auth surfaces

There are exactly two protected surfaces, with **separate, unrelated** cookies and middleware:

1. **Admin** (`/api/admin/*`, `/admin/*`) — the single seeded account, JWT in the `token` cookie, `AdminRequired` middleware. Full read/write control.
2. **Gated visitor access** (`/private`, `GET /api/private/profile`) — approved-visitor access to the private profile page only. No password and no user account; access is granted per-request by you and carried in a separate `access_session` cookie via `AccessRequired` middleware. A visitor with an access session can read the private profile and **nothing else** — they have zero write ability anywhere.

These never mix: an admin JWT does **not** grant `/private` access-session semantics and vice versa (though the admin can, of course, hold both cookies). See [§20](#20-gated-private-profile-page-access-request-flow) for the full gated-access design.

### JWT delivery

JWT is delivered as an `httpOnly` cookie, not an `Authorization` header. JavaScript cannot read it. This prevents XSS token theft. The Go middleware reads it via `c.Cookie("token")`. The gated-page `access_session` cookie is delivered the same way (`httpOnly; Secure; SameSite=Lax`).

---

## 8. Database schema

### Migration 001 — users

```sql
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,         -- bcrypt cost 12
  role          TEXT        NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration 002 — posts

```sql
CREATE TYPE post_type AS ENUM ('weekly', 'daily', 'deep-dive', 'til');

CREATE TABLE posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  type          post_type   NOT NULL DEFAULT 'weekly',
  title         TEXT        NOT NULL,
  summary       TEXT        NOT NULL,          -- 2–3 sentence teaser, shown on list page
  body          TEXT        NOT NULL,          -- raw Markdown, may contain R2 URLs
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  reading_time  INT         NOT NULL DEFAULT 0, -- computed: ceil(word_count / 200)
  published_at  TIMESTAMPTZ,                   -- NULL = draft; set on publish
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_published ON posts (published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_posts_tags      ON posts USING GIN (tags);
CREATE INDEX idx_posts_type      ON posts (type);
```

### Migration 003 — media

```sql
CREATE TABLE media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        REFERENCES posts(id) ON DELETE CASCADE,
  r2_key      TEXT        NOT NULL UNIQUE,    -- object key in R2 bucket
  url         TEXT        NOT NULL,           -- public CDN URL
  mime_type   TEXT        NOT NULL,           -- image/jpeg, image/png, video/mp4, etc.
  size_bytes  BIGINT      NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_post_id ON media (post_id);
```

### Migration 004 — projects

```sql
CREATE TABLE projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  url_live    TEXT,                            -- live demo URL, nullable
  url_repo    TEXT,                            -- GitHub repo URL, nullable
  featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INT         NOT NULL DEFAULT 0,  -- manual ordering in admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_sort ON projects (sort_order ASC);
```

### Migration 005 — now (currently working on widget)

```sql
CREATE TABLE now (
  id         INT         PRIMARY KEY DEFAULT 1,  -- always exactly one row
  body       TEXT        NOT NULL,               -- short Markdown or plain text
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO now (body) VALUES ('Setting up this portfolio.');
```

### Migration 006 — access_requests (gated private page)

One row per person who requests access to `/private`. It records the request details, moves through a status lifecycle, and (once approved) holds the hashed magic-link token and the hashed active session token. Storing **hashes only** means a database leak never exposes a usable link or session.

```sql
CREATE TYPE access_status AS ENUM ('pending', 'approved', 'denied', 'revoked');

CREATE TABLE access_requests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT          NOT NULL,
  email            TEXT          NOT NULL,
  reason           TEXT          NOT NULL DEFAULT '',   -- free-text "why do you want access"
  status           access_status NOT NULL DEFAULT 'pending',

  -- Magic link (single-use). Set on approval, cleared once consumed.
  magic_token_hash TEXT,                                 -- sha256 hex of the raw link token
  magic_expires_at TIMESTAMPTZ,                          -- link valid window (e.g. 24h from approval)
  magic_used_at    TIMESTAMPTZ,                          -- NULL until the link is clicked

  -- Access session (created when the magic link is consumed).
  session_hash     TEXT,                                 -- sha256 hex of the access_session cookie value
  session_expires_at TIMESTAMPTZ,                        -- rolling session window (e.g. 30d)

  -- Anti-abuse / audit
  ip               TEXT,                                 -- request origin IP (rate limiting + audit)
  user_agent       TEXT,
  telegram_msg_id  BIGINT,                               -- Telegram message id, so we can edit the buttons on decision

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(), -- when the form was submitted
  decided_at       TIMESTAMPTZ,                          -- when you approved/denied
  decided_by       TEXT                                  -- 'telegram' | 'admin-ui'
);

CREATE INDEX idx_access_status        ON access_requests (status);
CREATE INDEX idx_access_email         ON access_requests (lower(email));
CREATE INDEX idx_access_magic_hash    ON access_requests (magic_token_hash) WHERE magic_token_hash IS NOT NULL;
CREATE INDEX idx_access_session_hash  ON access_requests (session_hash)     WHERE session_hash    IS NOT NULL;
CREATE INDEX idx_access_created       ON access_requests (created_at DESC);
```

**Token model.** Raw tokens (magic link, session) are generated as 32 random bytes, base64url-encoded, and returned to the user (in the email URL / cookie). Only their `sha256` hex is stored. Validation hashes the incoming value and looks it up — so the DB never holds anything directly usable.

### Migration 007 — private_profile (content of the gated page)

Single-row table (same pattern as `now`) holding the content shown on `/private`. You edit it from `/admin/private-profile`. Kept as a mix of Markdown text fields and structured JSON so the frontend can render sections independently.

```sql
CREATE TABLE private_profile (
  id                INT         PRIMARY KEY DEFAULT 1,
  cv_markdown       TEXT        NOT NULL DEFAULT '',   -- detailed CV / career history (Markdown)
  projects_markdown TEXT        NOT NULL DEFAULT '',   -- deep project breakdowns (Markdown)
  contact_markdown  TEXT        NOT NULL DEFAULT '',   -- contact + availability + salary/work prefs (Markdown)
  resume_url        TEXT,                              -- R2 URL of downloadable resume PDF (nullable)
  references_json   JSONB       NOT NULL DEFAULT '[]', -- [{ name, relation, contact }]
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT single_row_pp CHECK (id = 1)
);

INSERT INTO private_profile (cv_markdown) VALUES ('# Private profile — fill me in from /admin/private-profile');
```

The resume PDF is uploaded through the existing `POST /api/admin/upload` pipeline (§6) with a reserved slug like `private/resume`, and its returned URL is saved into `resume_url`.

### Admin seed (runs at startup)

```sql
INSERT INTO users (email, password_hash, role)
VALUES (
  $ADMIN_EMAIL,
  crypt($ADMIN_PASSWORD, gen_salt('bf', 12)),
  'admin'
)
ON CONFLICT (email) DO NOTHING;
```

---

## 9. Cloudflare R2 setup

### Why R2 over S3 or GCS

| Feature | Cloudflare R2 | AWS S3 |
|---|---|---|
| Egress cost | **Free** | $0.09/GB |
| S3 API compatible | Yes — same SDK | Native |
| Free tier storage | 10 GB / month | 5 GB (12 months only) |
| CDN included | Yes — via Cloudflare | Extra cost (CloudFront) |

### Go SDK usage (aws-sdk-go-v2 pointed at R2)

```go
// internal/upload/r2.go

cfg, _ := awsconfig.LoadDefaultConfig(ctx,
    awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
        os.Getenv("R2_ACCESS_KEY_ID"),
        os.Getenv("R2_SECRET_ACCESS_KEY"),
        "",
    )),
    awsconfig.WithRegion("auto"),
)

client := s3.NewFromConfig(cfg, func(o *s3.Options) {
    o.BaseEndpoint = aws.String(
        fmt.Sprintf("https://%s.r2.cloudflarestorage.com", os.Getenv("R2_ACCOUNT_ID")),
    )
})

// Upload
_, err = client.PutObject(ctx, &s3.PutObjectInput{
    Bucket:      aws.String(os.Getenv("R2_BUCKET")),
    Key:         aws.String(r2Key),
    Body:        file,
    ContentType: aws.String(mimeType),
})

// Delete (called when post or media row is deleted)
_, err = client.DeleteObject(ctx, &s3.DeleteObjectInput{
    Bucket: aws.String(os.Getenv("R2_BUCKET")),
    Key:    aws.String(r2Key),
})
```

### Streaming upload — no temp files

```go
// Stream directly from multipart form to R2 — never touch local disk
file, header, err := c.Request.FormFile("file")
if err != nil { ... }
defer file.Close()

r2Key := fmt.Sprintf("posts/%s/%s-%d%s",
    slug, sanitize(header.Filename), time.Now().Unix(), ext)

// PutObject accepts an io.Reader — pass the multipart file directly
```

---

## 10. API endpoints

### Public — no auth required

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/posts` | Paginated published post list (summary only, no body). Query: `type`, `tag`, `page`, `limit` |
| `GET` | `/api/posts/:slug` | Full post with body (Markdown), tags, reading_time, published_at |
| `GET` | `/api/posts/tags` | Tag cloud with counts across all published posts |
| `GET` | `/api/projects` | All projects ordered by sort_order, featured first |
| `GET` | `/api/now` | Current "working on" widget content |
| `GET` | `/api/feed.rss` | RSS 2.0 feed of last 20 published posts |

### Gated-access flow — no admin auth (see [§20](#20-gated-private-profile-page-access-request-flow))

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/access/request` | Public. Body: `{ name, email, reason }`. Rate-limited by IP. Inserts a `pending` `access_requests` row, sends the Telegram alert with Approve/Deny buttons. Returns `{ ok: true }` (never leaks whether the email already requested) |
| `POST` | `/api/access/telegram/webhook` | Telegram Bot webhook. Receives the callback query when you tap Approve/Deny. Path segment includes a secret (`/api/access/telegram/webhook/:secret`). On Approve: generates magic token, emails the link, edits the Telegram message to "✅ Approved". On Deny: marks `denied`, edits to "⛔ Denied" |
| `GET` | `/api/access/unlock?token=…` | Public. Validates the magic token (exists, not expired, not used, status=approved). On success: marks it used, mints a session token, sets the `access_session` httpOnly cookie, returns `{ ok: true }`. On failure: `410 Gone` (expired/used) or `404` |
| `GET` | `/api/private/profile` | **`AccessRequired`.** Returns the private profile JSON (detailed CV, project breakdowns, contact/availability, resume + reference URLs). 401 if no valid `access_session` cookie |
| `POST` | `/api/access/logout` | Clears the `access_session` cookie and nulls the `session_hash` for that row |

### Admin — requires valid JWT with `role=admin`

#### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | `{ email, password }` → sets httpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Clears JWT cookie |
| `GET` | `/api/auth/me` | Returns `{ id, email, role }` from JWT |

#### Posts (admin)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/posts` | All posts including drafts, ordered by created_at DESC |
| `POST` | `/api/admin/posts` | Create post. Body: `{ slug, type, title, summary, body, tags }`. Returns draft |
| `PUT` | `/api/admin/posts/:slug` | Update post fields |
| `PUT` | `/api/admin/posts/:slug/publish` | Sets `published_at = NOW()`, triggers ISR revalidation |
| `PUT` | `/api/admin/posts/:slug/unpublish` | Sets `published_at = NULL` (back to draft) |
| `DELETE` | `/api/admin/posts/:slug` | Deletes post + cascades to media rows + deletes R2 objects |

#### Media (admin)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/upload` | `multipart/form-data` with `file` + `slug`. Streams to R2, inserts media row. Returns `{ url, mime_type, size_bytes }` |
| `DELETE` | `/api/admin/media/:id` | Deletes R2 object + media row |
| `GET` | `/api/admin/media?post_slug=` | List all media attached to a post |

#### Projects (admin)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/projects` | Create project |
| `PUT` | `/api/admin/projects/:slug` | Update project |
| `PUT` | `/api/admin/projects/reorder` | `{ ids: [...] }` — updates sort_order in bulk |
| `DELETE` | `/api/admin/projects/:slug` | Delete project |

#### Now widget (admin)

| Method | Path | Description |
|---|---|---|
| `PUT` | `/api/admin/now` | `{ body: "..." }` — updates the single row |

#### Access requests (admin — browser fallback for the Telegram buttons)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/access-requests` | List access requests. Query: `status` (pending/approved/denied/revoked), `page`. Returns name, email, reason, status, timestamps, active-session flag |
| `POST` | `/api/admin/access-requests/:id/approve` | Same effect as tapping Approve in Telegram: generates the magic link and emails it |
| `POST` | `/api/admin/access-requests/:id/deny` | Marks the request `denied` |
| `POST` | `/api/admin/access-requests/:id/revoke` | Revokes an already-granted access: nulls `session_hash`, sets status `revoked`. The visitor's next request to `/private` 401s |

#### Private profile content (admin — edits what `/private` shows)

The private profile is editable content, stored the same way the `now` widget is (single row of Markdown/JSON). Admin endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/private-profile` | Get the current private-profile content for editing |
| `PUT` | `/api/admin/private-profile` | Update the private-profile content (CV Markdown, project breakdowns, contact/availability, resume URL, references) |

---

## 11. Markdown rendering

### Frontend rendering (Next.js)

Blog post bodies are stored as raw Markdown strings and rendered client-side (or at SSG/ISR build time) using `react-markdown` with custom component overrides.

```tsx
// components/blog/md-renderer.tsx

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

const components = {
  // next/image for all img tags — automatic optimization + lazy loading
  img: ({ src, alt }: { src: string; alt: string }) => (
    <span className="block my-6">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={675}
        className="rounded-lg w-full h-auto"
        loading="lazy"
      />
    </span>
  ),

  // Native video element for mp4 — controls + preload=metadata (no autoplay)
  video: ({ src, ...props }: { src: string }) => (
    <video
      controls
      preload="metadata"
      className="w-full rounded-lg my-6 max-h-[480px]"
      {...props}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support HTML5 video.
    </video>
  ),

  // Syntax-highlighted code blocks
  code: ({ className, children }: { className?: string; children: React.ReactNode }) => {
    const language = className?.replace('language-', '') ?? ''
    return <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
  },
}

export function MDRenderer({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </ReactMarkdown>
  )
}
```

### next/image R2 domain whitelist

```js
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',        // R2 public bucket domain
      },
      {
        protocol: 'https',
        hostname: 'assets.yourdomain.com', // custom domain on R2 (optional)
      },
    ],
  },
}
```

### Reading time computation (Go)

Computed server-side when a post is created or updated. Stored in the `reading_time` column.

```go
// internal/service/post.go

func computeReadingTime(body string) int {
    words := len(strings.Fields(body))
    minutes := int(math.Ceil(float64(words) / 200.0))
    if minutes < 1 {
        return 1
    }
    return minutes
}
```

### ISR revalidation on publish

When a post is published via `PUT /api/admin/posts/:slug/publish`, Go calls the Next.js revalidation endpoint:

```go
// internal/handler/admin.go — after setting published_at

revalidateURL := fmt.Sprintf("%s/api/revalidate?secret=%s&path=/blog/%s",
    os.Getenv("APP_BASE_URL"),
    os.Getenv("REVALIDATE_SECRET"),
    slug,
)
http.Get(revalidateURL) // fire and forget
```

```ts
// app/api/revalidate/route.ts (Next.js)
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 })
  }
  revalidatePath(searchParams.get('path') ?? '/blog')
  return Response.json({ revalidated: true })
}
```

---

## 12. Environment variables

### Go API (.env)

```env
# Database
DATABASE_URL=postgres://user:pass@host:5432/portfolio

# Admin seed credentials
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=strong-password-here

# JWT
JWT_SECRET=32-byte-random-string-here
JWT_EXPIRY=72h

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=portfolio-media
R2_PUBLIC_URL=https://assets.yourdomain.com   # or https://pub-xxx.r2.dev

# App
APP_BASE_URL=https://yourdomain.com
PORT=8080

# Next.js ISR revalidation
REVALIDATE_SECRET=another-random-string

# Telegram Bot (gated-page approvals)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...           # from @BotFather
TELEGRAM_CHAT_ID=-1001234567890                # your private group/channel id (negative for groups)
TELEGRAM_WEBHOOK_SECRET=random-webhook-path-secret  # embedded in the webhook URL path

# Transactional email (magic-link delivery) — Resend
RESEND_API_KEY=re_...
EMAIL_FROM="Axror <access@yourdomain.com>"     # verified sender domain in Resend

# Gated-page access sessions
ACCESS_MAGIC_EXPIRY=24h                         # how long an emailed magic link stays valid
ACCESS_SESSION_EXPIRY=720h                      # how long a granted access session lasts (30d)
ACCESS_RATE_LIMIT_PER_HOUR=3                    # max /api/access/request submissions per IP per hour
```

### Next.js (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-fly-app.fly.dev
REVALIDATE_SECRET=another-random-string   # same as Go side
```

> **Secrets note:** `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`, `TELEGRAM_WEBHOOK_SECRET`, and `JWT_SECRET` are server-only — they live in Fly.io secrets (`flyctl secrets set …`), never in the Next.js `.env.local` and never prefixed `NEXT_PUBLIC_`.

---

## 13. Go project structure

```
portfolio-api/
├── cmd/
│   └── server/
│       └── main.go                  # entry: DB connect, seed admin, register routes
├── internal/
│   ├── handler/
│   │   ├── auth.go                  # login, logout, me
│   │   ├── posts.go                 # public: list, detail, tags, rss
│   │   ├── projects.go              # public: list
│   │   ├── now.go                   # public: get; admin: update
│   │   ├── access.go                # public: request, unlock, logout; Telegram webhook
│   │   ├── private.go               # AccessRequired: GET /api/private/profile
│   │   ├── admin_posts.go           # admin CRUD + publish/unpublish
│   │   ├── admin_projects.go        # admin CRUD + reorder
│   │   ├── admin_media.go           # upload, list, delete
│   │   ├── admin_access.go          # admin: list/approve/deny/revoke access requests
│   │   └── admin_private.go         # admin: get/update private_profile content
│   ├── middleware/
│   │   ├── auth.go                  # AdminRequired — reads JWT from cookie
│   │   ├── access.go                # AccessRequired — validates access_session cookie
│   │   ├── ratelimit.go             # per-IP limiter for POST /api/access/request
│   │   └── cors.go                  # CORS for Vercel frontend origin
│   ├── service/
│   │   ├── post.go                  # reading_time compute, slug validation
│   │   ├── revalidate.go            # ping Next.js ISR revalidation endpoint
│   │   ├── token.go                 # random token gen + sha256 hashing (magic + session)
│   │   ├── telegram.go              # send approval message, edit message on decision
│   │   └── email.go                 # Resend client — send magic-link email
│   ├── upload/
│   │   └── r2.go                    # PutObject, DeleteObject via aws-sdk-go-v2
│   └── store/                       # sqlc generated — do not edit manually
│       ├── db.go
│       ├── models.go
│       ├── users.sql.go
│       ├── posts.sql.go
│       ├── media.sql.go
│       ├── projects.sql.go
│       ├── now.sql.go
│       ├── access_requests.sql.go
│       └── private_profile.sql.go
├── db/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_posts.sql
│   │   ├── 003_create_media.sql
│   │   ├── 004_create_projects.sql
│   │   ├── 005_create_now.sql
│   │   ├── 006_create_access_requests.sql
│   │   └── 007_create_private_profile.sql
│   ├── queries/
│   │   ├── users.sql
│   │   ├── posts.sql
│   │   ├── media.sql
│   │   ├── projects.sql
│   │   ├── now.sql
│   │   ├── access_requests.sql
│   │   └── private_profile.sql
│   └── sqlc.yaml
├── Dockerfile
├── fly.toml
├── docker-compose.yml               # local: Go API + Postgres
├── .env.example
└── go.mod
```

### Dockerfile

```dockerfile
# Multi-stage build — small final image
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

---

## 14. Next.js project structure

```
portfolio-web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # homepage: hero, "now" widget, latest 3 posts
│   │   ├── about/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx             # post list, paginated, ISR
│   │   │   ├── [slug]/page.tsx      # full post with MDRenderer, ISR
│   │   │   └── tags/[tag]/page.tsx  # filtered by tag, ISR
│   │   ├── request-access/page.tsx  # public access-request form → POST /api/access/request
│   │   └── layout.tsx               # public layout: nav, footer
│   ├── private/
│   │   ├── page.tsx                 # SSR — reads access_session cookie, fetches /api/private/profile, 401→redirect
│   │   └── unlock/page.tsx          # SSR — reads ?token, calls /api/access/unlock, sets cookie, redirects to /private
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── layout.tsx               # auth guard — redirects if no JWT
│   │   ├── page.tsx                 # admin dashboard: post list, stats
│   │   ├── posts/
│   │   │   ├── new/page.tsx         # Markdown editor + media uploader
│   │   │   └── [slug]/edit/page.tsx # edit existing post
│   │   ├── projects/page.tsx
│   │   ├── now/page.tsx
│   │   ├── access-requests/page.tsx # list + approve/deny/revoke access requests
│   │   └── private-profile/page.tsx # edit the content shown on /private
│   └── api/
│       └── revalidate/route.ts      # ISR revalidation handler
├── components/
│   ├── blog/
│   │   ├── post-card.tsx            # summary card for list page
│   │   ├── md-renderer.tsx          # react-markdown + image + video renderers
│   │   ├── video-player.tsx         # native <video> wrapper with poster support
│   │   └── reading-time.tsx
│   ├── admin/
│   │   ├── md-editor.tsx            # textarea + preview toggle + media drop zone
│   │   └── media-uploader.tsx       # drag-drop → POST /api/admin/upload → insert URL
│   ├── access/
│   │   ├── request-form.tsx         # name/email/reason form with client validation
│   │   └── private-profile.tsx      # renders CV / projects / contact / resume / references
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── api.ts                       # typed fetch wrapper: get, post, put, del
│   └── types.ts                     # Post, Project, Media, NowWidget TS types
├── public/
│   └── og-image.png                 # Open Graph default image
├── next.config.ts                   # R2 domain whitelist for next/image
├── vercel.json
└── .env.local
```

---

## 15. Go dependencies

```go
// go.mod — key dependencies

// Router
github.com/gin-gonic/gin

// Database
github.com/jackc/pgx/v5
github.com/golang-migrate/migrate/v4

// sqlc (codegen tool — not imported at runtime)
// install: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

// Auth
github.com/golang-jwt/jwt/v5
golang.org/x/crypto                  // bcrypt
github.com/google/uuid               // UUID generation

// Cloudflare R2 (S3-compatible)
github.com/aws/aws-sdk-go-v2/config
github.com/aws/aws-sdk-go-v2/credentials
github.com/aws/aws-sdk-go-v2/service/s3

// Transactional email (magic-link delivery)
github.com/resend/resend-go/v2

// Telegram Bot API — no dependency needed; call the HTTPS Bot API
// (sendMessage / editMessageText / answerCallbackQuery) with net/http + encoding/json.
// Rate limiting for /api/access/request uses golang.org/x/time/rate (stdlib-adjacent).
golang.org/x/time                    // rate limiter

// Config
github.com/joho/godotenv
```

---

## 16. Next.js dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "react-syntax-highlighter": "^15.0.0",
    "swr": "^2.0.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-syntax-highlighter": "^15.0.0"
  }
}
```

---

## 17. CI/CD pipeline

### GitHub Actions — `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.23'

      - name: Run tests
        working-directory: ./portfolio-api
        run: go test ./...

      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master

      - run: flyctl deploy --remote-only
        working-directory: ./portfolio-api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel deploys automatically on push to main via its GitHub integration
      # No extra step needed — Vercel pulls from the repo directly
```

### Local development — `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_USER: portfolio
      POSTGRES_PASSWORD: portfolio
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  api:
    build: ./portfolio-api
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://portfolio:portfolio@postgres:5432/portfolio
    env_file:
      - ./portfolio-api/.env
    depends_on:
      - postgres

volumes:
  pg_data:
```

---

## 18. Build order

Build in this sequence to avoid debugging missing dependencies:

| Step | What to build | Why this order |
|---|---|---|
| 1 | DB migrations (users, posts, media, projects, now) | Everything depends on the schema |
| 2 | sqlc.yaml + queries, run `sqlc generate` | sqlc reads schema to produce Go code |
| 3 | R2 upload package (`internal/upload/r2.go`) | Admin media handler depends on it |
| 4 | Auth handler + `AdminRequired` middleware | Must protect all admin routes before building them |
| 5 | Admin seed in `main.go` | Need a working admin login to test anything |
| 6 | Public posts API (`GET /api/posts`, `/api/posts/:slug`, `/api/tags`) | Frontend needs real data |
| 7 | Public projects + now API | Completes the public surface |
| 8 | Admin posts CRUD + publish/unpublish | Core writing workflow |
| 9 | Media upload + delete endpoints | Needed to embed images/video in posts |
| 10 | Admin projects CRUD + reorder | Secondary admin feature |
| 11 | RSS feed (`GET /api/feed.rss`) | Nice to have, trivial once posts API works |
| 12 | Next.js — public pages (homepage, about, projects, blog list, blog detail) | Build against working API |
| 13 | Next.js — `MDRenderer` with image + video support | Test with real R2 URLs from step 9 |
| 14 | Next.js — admin pages (login, editor, media uploader) | Build last, needs all API complete |
| 15 | ISR revalidation wiring (Go pings Next.js on publish) | Polish step — works without it in dev |
| 16 | Migrations 006/007 + sqlc for `access_requests` & `private_profile` | Gated-page feature schema (see §20) |
| 17 | `service/token.go`, `service/email.go`, `service/telegram.go` | Shared helpers the access flow depends on |
| 18 | Public access API: `POST /api/access/request` + rate limiter | Entry point of the flow; testable with a mock Telegram send |
| 19 | Telegram webhook handler + `AccessRequired` middleware + unlock endpoint | Completes approve → email → unlock → session loop |
| 20 | Admin access-requests + private-profile endpoints | Browser fallback + content editing |
| 21 | Next.js — `/request-access`, `/private`, `/private/unlock`, admin access pages | Frontend for the whole gated feature |
| 22 | Register Telegram webhook (`setWebhook`) against the deployed API URL | Final wiring — only works once the API is publicly reachable |

---

## 19. Key design decisions

**Markdown stored as raw text in PostgreSQL**
No separate CMS, no headless CMS subscription, no vendor lock-in. The body column is plain text. You can query it, back it up with `pg_dump`, and render it anywhere. `react-markdown` on the frontend handles the rendering.

**Media URLs embedded directly in Markdown**
Images and videos are referenced as standard Markdown image syntax or HTML `<video>` tags pointing to R2 CDN URLs. The Markdown body is self-contained — if you move the site, the R2 URLs keep working. No separate media-reference lookup at render time.

**R2 over AWS S3**
Zero egress cost. A portfolio blog with images and mp4 demos will generate meaningful egress. R2 makes that free. The `aws-sdk-go-v2` works with R2 unchanged — just point `BaseEndpoint` at your R2 account URL.

**Streaming upload — no temp files on disk**
Go reads the multipart form file as an `io.Reader` and passes it directly to `PutObject`. Nothing is written to the container filesystem. Keeps the Fly.io container stateless and avoids disk space issues with large mp4 files.

**ISR (Incremental Static Regeneration) for blog pages**
Public blog pages are pre-rendered at build time and revalidated on demand when you publish a post. Visitors always get a fast static response. Drafts never appear — `published_at IS NOT NULL` filter in the public query.

**`reading_time` computed and stored — not derived at request time**
Counting words on every API response is wasteful. It is computed once on create/update and stored as an integer. The frontend displays it directly.

**`now` table uses a single-row constraint**
`CHECK (id = 1)` prevents multiple rows at the DB level. The Go handler always does `UPDATE now SET body = $1, updated_at = NOW() WHERE id = 1`. No upsert logic, no "latest row" queries.

**httpOnly JWT cookie — not Authorization header**
JavaScript on the page cannot read the cookie. XSS attacks cannot steal the admin token. The Go middleware reads it via `c.Cookie("token")`. The Next.js admin layout checks for the cookie server-side and redirects to `/admin/login` if absent.

**Multi-stage Dockerfile — small production image**
The builder stage compiles the Go binary with `CGO_ENABLED=0`. The final image is `alpine:3.20` with just `ca-certificates` added. Resulting image is ~20MB. Fast to push to Fly.io registry, fast to start.

---

## 20. Gated private profile page (access-request flow)

A second, private profile page (`/private`) that goes far deeper than the public `/about` — full career history, per-project case studies, contact + availability + salary expectations, and a downloadable resume with references. It is **not** publicly reachable. A visitor requests access through a form; you get a Telegram notification and approve or deny with one tap; on approval the visitor is emailed a single-use magic link that unlocks the page for their browser.

This section is the authoritative design for the feature. It complements the schema in [§8 (migrations 006/007)](#8-database-schema), the endpoints in [§10](#10-api-endpoints), and the pages in [§4](#4-pages-and-features).

### 20.1 Goals & non-goals

**Goals**
- A public form (`/request-access`) that any visitor can submit (name, email, reason).
- A **manual** approval gate — nothing is granted automatically. You decide, per person.
- Notifications land in your **Telegram group** with inline **Approve** / **Deny** buttons.
- On approval, the visitor receives an **emailed magic link** that grants a browser session for `/private`.
- Read-only access for approved visitors; they can never write anything.
- Everything revocable at any time from `/admin/access-requests`.

**Non-goals**
- No visitor accounts, no visitor passwords, no OAuth. Access is a per-request grant.
- No public discoverability of `/private` — it is unlinked from global nav (only reachable once you hold a session, or via the magic link).
- Not a full RBAC system. There is exactly one privileged role (admin) and one narrow read grant (access session).

### 20.2 End-to-end flow

```
1. Visitor opens /request-access, fills { name, email, reason }, submits.
        │
        ▼
2. POST /api/access/request
     • rate-limit by IP (ACCESS_RATE_LIMIT_PER_HOUR)
     • validate + normalize email
     • INSERT access_requests (status='pending', ip, user_agent)
     • Telegram sendMessage to TELEGRAM_CHAT_ID with inline buttons:
         [ ✅ Approve ]  [ ⛔ Deny ]   (callback_data = "approve:<id>" / "deny:<id>")
     • store returned telegram_msg_id on the row
     • respond { ok:true }  (generic — never reveals dup/prior state)
        │
        ▼
3. You tap ✅ Approve in the Telegram group.
        │
        ▼
4. Telegram → POST /api/access/telegram/webhook/<secret>
     • verify secret path segment + parse callback_data
     • load row by id; must be status='pending'
     • generate raw magic token (32 random bytes, base64url)
     • store sha256(magic) + magic_expires_at (now + ACCESS_MAGIC_EXPIRY); status='approved'
     • send email via Resend to the visitor:
         Subject: "Your access to Axror's private profile"
         Link:    {APP_BASE_URL}/private/unlock?token=<raw magic token>
     • answerCallbackQuery + editMessageText → "✅ Approved · emailed <name>"
        │
        ▼
5. Visitor clicks the emailed link → /private/unlock?token=… (Next.js SSR page)
     • server calls GET /api/access/unlock?token=…
     • Go: hash token, look up row; require status='approved',
            magic_used_at IS NULL, magic_expires_at > now()
     • mark magic_used_at = now()  (single-use — link dies here)
     • generate raw session token; store sha256(session) + session_expires_at
     • Set-Cookie: access_session=<raw session>; HttpOnly; Secure; SameSite=Lax; Max-Age=…
     • redirect visitor to /private
        │
        ▼
6. /private (SSR) forwards the access_session cookie to GET /api/private/profile.
     • AccessRequired middleware: hash cookie, find row where
         session_hash matches, status='approved', session_expires_at > now()
     • returns private profile JSON → page renders CV / projects / contact / resume.
     • 401 → Next.js redirects to /request-access.
```

**Deny path (step 3, ⛔):** webhook marks the row `denied`, edits the Telegram message to "⛔ Denied", sends no email. The visitor is never told they were denied (the `/request-access` confirmation only ever says "if approved, you'll receive an email").

### 20.3 Telegram bot setup

1. Create a bot with **@BotFather** → get `TELEGRAM_BOT_TOKEN`.
2. Create your **private group** (or channel), add the bot as an admin.
3. Find the chat id (`TELEGRAM_CHAT_ID`) — e.g. temporarily log `getUpdates`, or use `@RawDataBot`. Groups are negative ids; supergroups start `-100…`.
4. After the API is deployed and publicly reachable, register the webhook **once**:

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${APP_BASE_URL_API}/api/access/telegram/webhook/${TELEGRAM_WEBHOOK_SECRET}"
```

**Notification message (sendMessage payload):**

```json
{
  "chat_id": "<TELEGRAM_CHAT_ID>",
  "text": "🔐 New access request\n\nName: Jane Doe\nEmail: jane@acme.com\nReason: HR at Acme, reviewing you for a backend role\nWhen: 2026-07-21 14:03 UTC\nIP: 203.0.113.5",
  "reply_markup": {
    "inline_keyboard": [[
      { "text": "✅ Approve", "callback_data": "approve:<request-uuid>" },
      { "text": "⛔ Deny",    "callback_data": "deny:<request-uuid>" }
    ]]
  }
}
```

**Webhook security.** The webhook path carries `TELEGRAM_WEBHOOK_SECRET` as its last segment; requests without the exact path 404. Additionally, set the `secret_token` on `setWebhook` and verify Telegram's `X-Telegram-Bot-Api-Secret-Token` header. `callback_data` is parsed as `"<action>:<uuid>"` and the UUID is validated before any DB write.

### 20.4 Email (Resend)

Magic-link email is sent with the Resend Go SDK from a verified sender domain (`EMAIL_FROM`). Minimal, plain, no tracking:

```
Subject: Your access to Axror's private profile

Hi {name},

You've been granted access to my detailed profile page.
Open this link to unlock it (valid for 24 hours, one-time use):

{APP_BASE_URL}/private/unlock?token={rawToken}

If you didn't request this, you can ignore this email.
```

If email delivery fails, the webhook still marks the row approved but edits the Telegram message to "✅ Approved · ⚠️ email failed, use /admin to resend" so you can retry from `/admin/access-requests`.

### 20.5 Token & session security

| Concern | Handling |
|---|---|
| Token generation | `crypto/rand`, 32 bytes, base64url (`service/token.go`) |
| Storage | Only `sha256` hex stored (`magic_token_hash`, `session_hash`) — never the raw value |
| Magic link | Single-use (`magic_used_at`) + expiring (`magic_expires_at`, default 24h) |
| Session cookie | `access_session`: `HttpOnly; Secure; SameSite=Lax`; rolling expiry `ACCESS_SESSION_EXPIRY` (30d) |
| Cookie scope | Access cookie is entirely separate from the admin `token` cookie; different name, different middleware |
| Revocation | `POST /api/admin/access-requests/:id/revoke` nulls `session_hash` → immediate 401 on next request |
| Rate limiting | `POST /api/access/request` limited per IP (`ACCESS_RATE_LIMIT_PER_HOUR`, default 3/h) to stop spam to Telegram |
| Enumeration | `/api/access/request` always returns generic `{ ok:true }`; unlock failures are `404`/`410` without detail |
| Least privilege | Access session authorizes exactly one endpoint (`GET /api/private/profile`) and its page; no write routes accept it |

### 20.6 `AccessRequired` middleware (Go sketch)

```go
// internal/middleware/access.go
func AccessRequired(q *store.Queries) gin.HandlerFunc {
    return func(c *gin.Context) {
        raw, err := c.Cookie("access_session")
        if err != nil || raw == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "no access"})
            return
        }
        hash := service.Sha256Hex(raw)
        row, err := q.GetActiveAccessBySession(c, hash) // status='approved' AND session_expires_at > now()
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "invalid or expired access"})
            return
        }
        c.Set("access_request_id", row.ID)
        c.Next()
    }
}
```

### 20.7 `/private` rendering (Next.js SSR)

`/private` is **SSR, not SSG/ISR** — it must never be statically cached, since its content is privileged. The page reads the `access_session` cookie server-side, calls `GET /api/private/profile` with it, and either renders or redirects:

```tsx
// app/private/page.tsx  (Server Component)
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'   // never cache

export default async function PrivatePage() {
  const session = (await cookies()).get('access_session')?.value
  if (!session) redirect('/request-access')

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/private/profile`, {
    headers: { cookie: `access_session=${session}` },
    cache: 'no-store',
  })
  if (res.status === 401) redirect('/request-access')

  const profile = await res.json()
  return <PrivateProfile {...profile} />
}
```

The page also sets `X-Robots-Tag: noindex` / a `noindex` meta so search engines never index it, and `/private*` is disallowed in `robots.txt`.

### 20.8 Admin management surface (`/admin/access-requests`)

A table of all requests with columns: name, email, reason, status, requested-at, decided-at, active-session (yes/no). Row actions:

- **Approve** / **Deny** — for `pending` rows (mirrors the Telegram buttons; useful if a notification was missed).
- **Resend link** — for `approved` rows whose email failed or whose link expired unused (issues a fresh magic token).
- **Revoke** — for rows with an active session; kills access immediately.

This gives you a browser fallback for the entire flow so you are never dependent on Telegram being reachable.

### 20.9 Edge cases & decisions

| Case | Behavior |
|---|---|
| Same email requests twice | Each submission is its own row; approving any valid pending row works. Old links/sessions are independent. |
| Magic link clicked twice | First click consumes it (`magic_used_at`); second click → `410 Gone`. Visitor already has the session cookie from the first click. |
| Link expired before click | `410 Gone`; visitor must re-request (or you "Resend link" from admin). |
| Approved but you change your mind | **Revoke** — nulls the session, status→`revoked`. Any held cookie stops working immediately. |
| Telegram webhook down | Approve/deny from `/admin/access-requests`; identical effect. |
| Bot spammed via the form | Per-IP rate limit + generic response; excess submissions are dropped before hitting Telegram. |
| Visitor loses the email | You "Resend link" from admin, or they re-submit the form. |
| Search engine tries to crawl `/private` | `noindex` + `robots.txt` disallow + SSR 401→redirect; nothing privileged is served. |

---

*Generated: July 2026 · Gated-page feature (§20) added July 2026*
