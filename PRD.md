# UGC Creator CRM — Product Requirements Document

## Overview
A multi-user SaaS web application for UGC (User-Generated Content) creators to track campaigns, videos, earnings, and get AI-powered recommendations. Built for Ken (FX Kennard Sugirotok), Indonesian UGC creator targeting the US market.

---

## 1. Concept & Vision

**UGC Creator CRM** is a command-center for serious UGC creators who are tired of tracking everything in spreadsheets. It feels like a Bloomberg terminal for creators — dark, data-dense, powerful, and fast. No fluff. Just insights, performance tracking, and AI recommendations that help creators know exactly what to make next.

**Core Identity:** Lethal, efficient, strategic. Like a weapon built for a single purpose — winning.

---

## 2. Design Language

- **Aesthetic:** Dark mode terminal/cyberpunk — deep blacks (#0a0a0f), electric green accents (#00FF88), data-dense layouts
- **Typography:** System fonts, monospace for numbers/data, compact sizing
- **Color Palette:**
  - Background: #0a0a0f (deep black)
  - Surface: #111118 (card bg)
  - Border: #1e1e2e
  - Primary Accent: #00FF88 (neon green)
  - Secondary: #00BFFF (cyan)
  - Danger: #FF6B6B (red)
  - Warning: #FFD700 (gold)
  - Muted text: #444, #666, #888
- **Layout:** Fixed sidebar navigation (56px wide), main content area with grid-based stat cards
- **Motion:** Minimal — fast transitions only, no decorative animations

---

## 3. Target Users

- **Primary:** Ken (FX Kennard Sugirotok) — UGC creator, Indonesia, targeting US market
- **Secondary:** Small UGC agencies (future)
- **Not for:** Casual creators, clients, non-technical users

---

## 4. Core Features

### 4.1 Multi-User Auth & Workspaces
- Supabase Auth (email/password)
- Workspace-based isolation — each user has their own workspace
- Invite system: admins generate invite links with role (admin/member/viewer)
- No public signups — all accounts must be invited
- Roles:
  - **Admin:** full access, manage members, delete workspace
  - **Member:** full CRUD on campaigns/videos/config
  - **Viewer:** read-only access

### 4.2 Dashboard
- Summary stat cards: Campaigns, Videos Posted, Total Videos Tracked, Total Earnings (USD)
- Financial cards: Total Income (IDR), Total Expense (IDR), Net Profit (IDR)
- Recent Videos table with campaign, status, views, earnings
- Currency: all USD values stored, IDR for local display
- Exchange rate configurable (default 17,000 IDR/USD)

### 4.3 Campaigns
- Track brand partnerships: brand name, platform, rate type (rpm/fixed), rate amount, status (active/inactive/paused), notes
- Link videos to campaigns
- Campaign performance overview (views, earnings, video count)
- Seeded campaigns: Insforge (tiktok, rpm, 0.45), Neo Browser (tiktok, rpm, 0.40)

### 4.4 Videos
- Track each video: title, filename, campaign, platform, posted date, status
- Metrics: views, likes, comments, shares, watch time, RPM, earnings
- AI metadata: hook type, niche, format, has before/after, text overlay, duration bucket, posted time bucket, AI score, AI tag
- Manual entry or bulk import via xlsx

### 4.5 Import (xlsx)
- Upload Excel spreadsheet with historical video data
- Parse columns: Title, File Name, Campaign, Platform, Posted Date, Status, Views, Likes, Comments, Shares, Watch Time, RPM, Earnings, Hook Type, Niche, Format, Has Before/After, Text Overlay, Duration, Posted Time, AI Score, AI Tag, Notes
- Upsert logic to avoid duplicates
- Seed config values (total_income_idr, total_expense_idr)

### 4.6 Analytics (Phase 2)
- Video performance over time
- Best performing hook types, niches, formats
- Platform comparison
- Campaign ROI
- Weekly/monthly trends

### 4.7 AI Recommendations (Phase 3)
- Based on top-performing video patterns
- Suggest next video topics, hook types, formats
- Identify gaps in content strategy
- Score new video ideas before posting

### 4.8 Income Tracker
- Total earnings in USD and IDR
- Rate simulation (what if RPM changes?)
- Historical earnings per campaign
- Export data

### 4.9 Settings
- Configure exchange rate, editor rate, default platform
- Manage workspace members (invite/remove)
- Account sign out

---

## 5. Technical Architecture

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (custom dark theme)
- **State:** React hooks + fetch
- **Auth:** @supabase/ssr for cookie-based sessions
- **Deployment:** Vercel

### Backend
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** Supabase Auth with @supabase/ssr
- **API:** Next.js Route Handlers (App Router API routes)

### Database Schema
```
Workspace
  - id (UUID, PK)
  - name
  - slug
  - plan (free/pro)
  - stripeCustomerId (optional)
  - createdAt, updatedAt

WorkspaceMember
  - id (UUID, PK)
  - workspaceId (FK)
  - userId (Supabase Auth user ID)
  - role (admin/member/viewer)
  - createdAt

Invite
  - id (UUID, PK)
  - workspaceId (FK)
  - email
  - role
  - code (unique)
  - expiresAt
  - acceptedAt (nullable)
  - createdAt

Campaign
  - id (UUID, PK)
  - brandName
  - platform (tiktok/youtube/both)
  - rateType (rpm/fixed)
  - rateAmount
  - status (active/inactive/paused)
  - startDate (optional)
  - notes (optional)
  - workspaceId (FK)
  - createdAt, updatedAt

Video
  - id (UUID, PK)
  - title, fileName
  - platformVideoId (optional)
  - platform (tiktok/youtube/both)
  - postedAt (optional)
  - status (idea/draft/in_review/posted/rejected)
  - views, likes, comments, shares, watchTime
  - rpm, earnings
  - hookType, niche, format
  - hasBeforeAfter, hasTextOverlay
  - durationBucket, postedTimeBucket
  - aiScore, aiTag
  - notes
  - workspaceId (FK)
  - campaignId (FK, optional)
  - createdAt, updatedAt

Config
  - workspaceId (FK, part of PK)
  - key (part of PK)
  - value
  - updatedAt
  @@id([workspaceId, key])

WeeklyLog
  - id (UUID, PK)
  - week (YYYY-WW format)
  - workspaceId (FK)
  - videosPosted
  - totalViews
  - totalEarnings
  - notes
  - createdAt, updatedAt
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://vdizlbrqxjzssuqtdkhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public anon key>
DATABASE_URL=<PostgreSQL connection string>
SUPABASE_SERVICE_ROLE_KEY=<secret key — server only>
```

---

## 6. API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Dashboard stats + recent videos |
| GET/POST | /api/campaigns | List/create campaigns |
| PUT/DELETE | /api/campaigns | Update/delete campaign |
| GET/POST | /api/videos | List/create videos |
| PUT/DELETE | /api/videos | Update/delete video |
| GET/PUT | /api/config | Get/update workspace config |
| POST | /api/import | Bulk import videos from xlsx |
| GET | /api/auth/workspace | Get user's workspaces |
| POST | /api/auth/workspace | Create workspace |
| GET | /api/auth/invite?code=X | Get invite details |
| POST | /api/auth/invite | Generate invite (admin) |
| POST | /api/auth/invite/accept | Accept invite |
| GET | /api/auth/members | List workspace members |

---

## 7. Security Requirements

- [x] All API routes require authentication (middleware)
- [x] Workspace membership checked on every data operation
- [x] Resource ownership verified (users can only access their own workspace data)
- [x] Invite codes are random + expiring (7 days)
- [x] No sensitive keys in client bundle
- [x] Error messages sanitized (no internal details leaked)
- [ ] Rate limiting on auth endpoints (TODO)
- [ ] Email verification for invite acceptance (TODO)
- [ ] API key rotation mechanism (TODO)

---

## 8. Known Issues / TODO

- [ ] Invite codes are guessable (12-char hex) — needs rate limiting + email verification
- [ ] GitHub push blocked (PAT needs repo scope)
- [ ] xlsx import — need to complete UI
- [ ] AI recommendation engine (Phase 3)
- [ ] Stripe subscription (Phase 4)
- [ ] Mobile-responsive layout

---

## 9. Deployment

- **URL:** https://ugc-crm-one.vercel.app
- **Project:** prj_7sLGBmA2ZIPwtFjg3rVLJONOKRsL
- **Team:** kennn21s-projects
- **Account:** kennardfx@gmail.com / GenosUGC2026!
- **Supabase:** vdizlbrqxjzssuqtdkhy
- **Database:** Direct connection via aws-1-ap-northeast-1.pooler.supabase.com:5432
