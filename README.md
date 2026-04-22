# UGC Creator CRM

A multi-user SaaS web app for UGC creators to track campaigns, videos, earnings, and AI-powered recommendations.

**Live:** https://ugc-crm-one.vercel.app

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/kennsr/ugc-crm.git
cd ugc-crm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` — fill in your Supabase project credentials.

> **Get env values from:** Supabase Dashboard → Project Settings → API
> - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon public` key
> - `DATABASE_URL` — Connection string (use Connection Pooling, port 6543)
> - `SUPABASE_SERVICE_ROLE_KEY` — `service_role` secret key (server-only, never commit)

### 4. Generate Prisma client & push schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Database:** Supabase (PostgreSQL via Prisma ORM)
- **Auth:** Supabase Auth with `@supabase/ssr` cookie-based sessions
- **Hosting:** Vercel

---

## Project Structure

```
src/
├── app/
│   ├── api/              # Route handlers (GET/POST/PUT/DELETE)
│   │   ├── auth/         # Auth endpoints (workspace, invite, members)
│   │   ├── campaigns/    # Campaign CRUD
│   │   ├── videos/       # Video CRUD
│   │   ├── config/       # Workspace config
│   │   ├── dashboard/    # Dashboard stats
│   │   └── import/       # xlsx bulk import
│   ├── login/            # Login page
│   ├── signup/           # Signup page (currently closed)
│   ├── campaigns/        # Campaigns UI
│   ├── videos/           # Videos UI
│   ├── analytics/        # Analytics UI
│   ├── income/           # Income tracker UI
│   ├── import/           # xlsx import UI
│   ├── settings/         # Settings + logout
│   └── layout.tsx        # Root layout with sidebar
├── lib/
│   ├── prisma.ts         # Prisma singleton
│   ├── supabase.ts       # Client-side Supabase client
│   └── supabase-server.ts # Server-side cookie-aware Supabase client
└── middleware.ts          # Auth guard (redirects unauthenticated users)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `DATABASE_URL` | Yes | Prisma DB connection (pgbouncer port 6543) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key — **never expose to client** |

> **Security:** Never commit `.env.local`. It's in `.gitignore`.

---

## Deployment

### Vercel (Automatic)

Push to `main` → Vercel deploys automatically.

### Manual

```bash
vercel --prod
```

Set env vars in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Authentication Flow

1. User submits email + password on `/login`
2. Browser calls `supabase.auth.signInWithPassword()` via `@supabase/ssr`
3. Supabase returns session tokens stored as HTTP-only cookies
4. `middleware.ts` reads cookies on every request — redirects to `/login` if unauthenticated
5. API routes verify session via `@supabase/ssr` then query Prisma directly

> API routes use **Prisma** (not Supabase REST) to avoid PostgREST schema cache issues. Auth is still verified via Supabase session cookies.

---

## Contributing

1. Fork the repo or create a branch
2. Clone and `npm install`
3. Copy `.env.example` → `.env.local` and fill in your Supabase credentials
4. `npx prisma generate && npx prisma db push`
5. `npm run dev` — test locally
6. Push to your branch → open a Pull Request

---

## Docs

- Product spec: `PRD.md`
- Auth spec: `PRD-AUTH.md`

---

## Owner

- **Ken** (FX Kennard Sugirotok) — @kennn2211
- **Supabase:** https://supabase.com/dashboard/project/vdizlbrqxjzssuqtdkhy
