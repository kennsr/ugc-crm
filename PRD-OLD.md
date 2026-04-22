# UGC Creator Intelligence System — PRD
**Project:** Genos UGC CRM / Creator Analytics Platform  
**Author:** Genos (for Master Ken)  
**Date:** April 22, 2026  
**Stage:** Planning → Build  

---

## 1. Problem Statement

Ken manages a growing UGC career with:
- Multiple brand campaigns (Insforge, Neo Browser, more incoming)
- Multiple platforms (TikTok, YouTube)
- Multiple videos per campaign, each with different performance metrics
- No central system to track, analyze, and learn from performance data
- Manual decision-making on what content to produce next

**Pain Points:**
- Performance data scattered across TikTok Creator Center, YouTube Studio, brand DMs
- No visibility on which video format/hook/thumbnail performs best
- No data-driven recommendations for next content
- Hard to compare campaign ROI
- No historical trend analysis

---

## 2. Vision

> A central nervous system for Ken's UGC career.  
> Every video tracked. Every metric analyzed. Every decision informed by data.  
> AI that learns from your track record and tells you what to shoot next — and why.

**Key Analogy:** Just like a CRM tracks leads → deals → revenue for sales teams, this system tracks videos → views → earnings for content creators.

---

## 3. Target Users

**Primary:** Ken (FX Kennard Sugirotok)  
**Secondary:** Potential future use — Ken's editor(s), partners

---

## 4. Core Entities

### 4.1 Campaign (Brand Partnership)
```
- brand_name: string (e.g., "Insforge", "Neo Browser")
- platform: enum ["tiktok", "youtube", "instagram", "both"]
- rate_type: enum ["fixed", "fixed_plus_views", "rev_share"]
- rate_amount: number (in USD)
- status: enum ["active", "paused", "completed", "negotiating"]
- start_date: date
- notes: string
- created_at: timestamp
```

### 4.2 Video
```
- video_id: string (internal UUID)
- campaign_id: reference (Campaign)
- title: string
- platform_video_id: string (TikTok video ID / YouTube video ID)
- platform: enum ["tiktok", "youtube"]
- posted_at: datetime
- status: enum ["draft", "posted", "processing"] (processing = brand reviewing)

-- Performance Fields (populated manually or via API later) --
- views: integer
- likes: integer
- comments: integer
- shares: integer
- watch_time: string (YouTube)
- rpm: number (YouTube revenue per mille)
- earnings: number (USD)

-- Content Tags (for AI analysis) --
- hook_type: enum ["shock", "curiosity", "story", "educational", "comedy", "meta"]
- niche: string (e.g., "tech", "lifestyle", "gaming")
- format: enum ["review", "unboxing", "storytime", "howto", "day_in_life", "duet"]
- has_before_after: boolean
- has_text_overlay: boolean
- duration_bucket: enum ["<30s", "30-60s", "1-3min", ">3min"]
- posted_at_time_bucket: enum ["morning", "afternoon", "evening", "late_night"]

-- AI-Generated Fields --
- ai_score: number (0-100, predicted virality before posting)
- ai_tag: string (e.g., "high curiosity hook + tech niche = strong")
```

### 4.3 Weekly Performance Log
```
- week_start: date
- campaign_id: reference
- videos_posted: integer
- total_views: integer
- total_earnings_usd: number
- net_earnings_idr: number (after ops costs)
- notes: string
```

---

## 5. Core Features

### 5.1 Campaign Dashboard
- List all campaigns with status, rate, platform
- Total earnings per campaign
- Campaign-level ROI comparison
- Add / edit / archive campaigns

### 5.2 Video Tracker
- Table of all videos across all campaigns
- Per-video performance metrics (views, likes, RPM, earnings)
- Filter by: campaign, platform, date range, hook type, niche
- Sort by: views, earnings, engagement rate, date
- Manual entry form for new videos
- "Posting Log" — quick-add form for daily video logging

### 5.3 Performance Analytics
- **Per-Video Chart:** Views + earnings over time
- **Campaign Comparison:** Bar chart of earnings per campaign
- **Hook Type Analysis:** Which hook types drive most views/earnings
- **Best Performing Windows:** Time-of-day / day-of-week analysis
- **Platform Split:** TikTok vs YouTube revenue breakdown
- **Weekly/Monthly Trend Line:** Income trend with projection
- **Engagement Rate:** (likes + comments + shares) / views

### 5.4 AI Content Recommendations
The core intelligence layer. After each video:

1. **Input:** Video metadata + performance data
2. **AI Analysis:**
   - "Videos with curiosity hooks in tech niche averaged 50% more views"
   - "Your 30-60s format outperforms <30s by 2.3x in earnings"
   - "Thursday evening posts get 1.8x more views than other windows"
3. **Output — Before You Shoot:**
   - "Recommended hook type for this campaign: [X]"
   - "Recommended format: [Y]"
   - "Best posting window this week: [Z]"
   - "Why: [based on your historical data]"
4. **Post-Video Analysis:**
   - Compare predicted vs actual performance
   - "This video underperformed by 40%. Likely because [hook was X not Y]"

### 5.5 Income Tracker
- Fixed costs calculator (ops costs: editor 20%, food/coffee)
- Net income per video / week / month
- IDR conversion (live rate)
- Projection to monthly goal (18M IDR = job income baseline)
- 100M milestone tracker

### 5.6 Content Archive
- All videos stored with thumbnails (YouTube) or links (TikTok)
- Searchable by tag, campaign, date
- Notes field for each video ("brand asked to reshoot", "went viral unexpectedly")

---

## 6. Tech Stack

### Frontend
- **Next.js** (React) — clean web UI
- **Tailwind CSS** — styling
- **shadcn/ui** — component library
- Hosted on the cloud instance at `161.118.192.114`

### Backend
- **Node.js / Next.js API Routes** — lightweight API
- **SQLite** (file-based DB, via `better-sqlite3`) — simple, portable
- **Prisma** — ORM for SQLite

### AI Layer
- **OpenAI (GPT-4)** — analysis + recommendations
- Called via `openai` npm package
- Prompts engineered to use Ken's historical data

### Data Entry
- Manual entry via web UI (fastest to build)
- Optional: TikTok/YouTube API integrations later

---

## 7. Database Schema (SQLite)

```sql
-- Campaigns
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  platform TEXT NOT NULL, -- tiktok | youtube | both
  rate_type TEXT NOT NULL, -- fixed | fixed_plus_views | rev_share
  rate_amount REAL NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Videos
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  title TEXT,
  platform_video_id TEXT,
  platform TEXT NOT NULL,
  posted_at TEXT,
  status TEXT DEFAULT 'posted',
  
  -- performance
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  watch_time TEXT,
  rpm REAL,
  earnings REAL DEFAULT 0,
  
  -- content tags
  hook_type TEXT,
  niche TEXT,
  format TEXT,
  has_before_after INTEGER DEFAULT 0,
  has_text_overlay INTEGER DEFAULT 0,
  duration_bucket TEXT,
  posted_time_bucket TEXT,
  
  -- AI
  ai_score REAL,
  ai_tag TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Logs
CREATE TABLE weekly_logs (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  campaign_id TEXT REFERENCES campaigns(id),
  videos_posted INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_earnings_usd REAL DEFAULT 0,
  net_earnings_idr REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Ops Cost Config
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## 8. Build Phases

### Phase 1: Core Tracker (MVP) — 1-2 days
- Campaign CRUD (add/edit/list campaigns)
- Video CRUD (add/list videos with manual performance entry)
- Simple performance table (sortable)
- Basic charts (views + earnings)
- **No AI yet** — just data collection

### Phase 2: Analytics — 1 day
- Hook type performance chart
- Platform comparison chart
- Weekly income trend
- Engagement rate calculations
- Time-of-day performance analysis

### Phase 3: AI Recommendations — 1-2 days
- After every 5+ videos → AI analyzes patterns
- Pre-shoot recommendation engine
- Post-shoot performance debrief
- "What to shoot next" suggestion cards

### Phase 4: Income + Projections — 1 day
- Ops cost calculator
- Net income per video/week/month
- 18M IDR baseline tracker
- 100M milestone tracker
- Live IDR/USD conversion

### Phase 5: Integrations (Future)
- TikTok Creator Center API (automated view counts)
- YouTube Data API
- Auto-pull performance data daily

---

## 9. UI Layout (Next.js Pages)

```
/                     → Dashboard (overview)
/campaigns            → Campaign list + management
/campaigns/[id]       → Single campaign detail + its videos
/videos               → Video list (all platforms)
/videos/add           → Quick-add video entry form
/analytics            → Charts + hook analysis
/recommendations      → AI pre-shoot suggestions
/income               → Income tracker + projections
/settings             → Ops cost config, currency settings
```

---

## 10. Key Metrics to Track

| Metric | Source | Update Frequency |
|--------|--------|-----------------|
| Views | Manual / Future API | Daily |
| Likes | Manual / Future API | Daily |
| Comments | Manual / Future API | Daily |
| Shares | Manual / Future API | Daily |
| RPM | Manual | Per video |
| Earnings (USD) | Manual | Per video |
| Net Earnings (IDR) | Calculated | Per video |
| Engagement Rate | Calculated | Per video |

---

## 11. Success Criteria

- [ ] Ken can log a new video in < 60 seconds
- [ ] All campaign performance visible in one screen
- [ ] AI recommendations are specific and actionable (not generic)
- [ ] Income tracker shows real-time net after costs
- [ ] System survives 6+ months of data without slowdown

---

## 12. Out of Scope (v1)

- Auto-posting to TikTok/YouTube
- Brand outreach / cold pitch features
- Multi-user support
- Mobile app
- TikTok/YouTube API integrations (Phase 5)
