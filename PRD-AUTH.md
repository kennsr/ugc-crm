# UGC CRM — Auth & Multi-User System PRD
**Project:** Genos UGC CRM  
**Version:** 2.0 (Multi-User + Subscription-Ready)  
**Date:** April 22, 2026  
**Stage:** Auth Build  

---

## 1. Overview

Transform UGC CRM from a single-user app into a **multi-tenant SaaS** where:
- Users sign up and create their own workspace
- Workspace owner (Admin) invites members via email/link
- Each user only sees their own workspace data
- Subscription model ready for future Stripe integration

**Analogy:** Notion-style workspaces — you have a workspace, you invite people to it, everyone in the same workspace shares the data.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Auth | Supabase Auth (email/pass + OAuth) |
| Database | Supabase Postgres (already connected) |
| ORM | Prisma (already in use) |
| Auth UI | Custom React components + Supabase JS client |
| Payments (future) | Stripe — workspace.subscription_tier + stripe_customer_id |

---

## 3. Database Schema Changes

### New Models

```prisma
// Workspace (tenant container)
model Workspace {
  id            String   @id @default(cuid())
  name          String   @default("My UGC Workspace")
  slug          String   @unique  // URL-friendly name for invites
  plan          String   @default("free")  // free | pro
  stripeCustomerId String?
  createdAt     DateTime @default(now())
  
  members       WorkspaceMember[]
  campaigns     Campaign[]
  videos        Video[]
  configs       Config[]
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String   // Supabase Auth user ID
  role        String   @default("member") // admin | member | viewer
  
  @@unique([workspaceId, userId])
}

model Invite {
  id          String   @id @default(cuid())
  workspaceId String
  email       String
  role        String   @default("member")
  code        String   @unique
  expiresAt   DateTime
  acceptedAt DateTime?
  createdAt   DateTime @default(now())
}
```

### Updated Existing Models (add workspaceId FK)

```prisma
model Campaign {
  // ... existing fields ...
  workspaceId String
  workspace  Workspace @relation(fields: [workspaceId], references: [id])
}

model Video {
  // ... existing fields ...
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

---

## 4. Row Level Security (RLS) Policies

Postgres RLS on all workspace-scoped tables:

| Table | Policy |
|---|---|
| workspaces | user is owner (admin role) |
| workspace_members | userId = current_user |
| campaigns | workspaceId IN user's workspaces |
| videos | workspaceId IN user's workspaces |
| invites | workspaceId = user's admin workspace |

---

## 5. Auth Flow

### 5.1 Sign Up
- Email + password via Supabase Auth
- Or Google OAuth (one-click sign in)
- On first sign up → auto-create workspace named after user's email prefix
- Redirect to `/dashboard`

### 5.2 Sign In
- Email + password OR Google OAuth
- Redirect to `/dashboard`

### 5.3 Invite Flow
- Admin generates invite link from `/settings/team`
- System creates `Invite` with 7-day expiry code
- Ken shares link: `ugc-crm-one.vercel.app/invite/[code]`
- Recipient signs up/in → gets added to workspace as `member`

### 5.4 Role Permissions
| Action | Admin | Member | Viewer |
|---|---|---|---|
| View all workspace data | ✅ | ✅ | ✅ |
| Add/Edit videos | ✅ | ✅ | ❌ |
| Delete videos | ✅ | ❌ | ❌ |
| Manage campaigns | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Manage team | ✅ | ❌ | ❌ |
| Change subscription | ✅ | ❌ | ❌ |

---

## 6. Pages

| Route | Description |
|---|---|
| `/login` | Sign in page (email/pass + Google) |
| `/signup` | Sign up page (email/pass + Google) |
| `/invite/[code]` | Accept invite — lands here from invite link |
| `/dashboard` | Protected — workspace overview |
| `/settings/team` | Admin only — invite/remove members |
| `/settings/billing` | Admin only — Stripe subscription (future) |

---

## 7. API Routes (Auth)

```
POST /api/auth/signup        — Create account + auto workspace
POST /api/auth/login        — Supabase login
POST /api/auth/logout       — Clear session
GET  /api/auth/me           — Current user + workspace info
POST /api/auth/invite       — Generate invite link (admin only)
POST /api/auth/invite/accept — Accept invite + add to workspace
GET  /api/auth/workspace-members — List members
DELETE /api/auth/members/[id] — Remove member (admin only)
```

---

## 8. Supabase Auth Setup Required

Ken needs to configure in Supabase Dashboard:
1. **Auth Providers** → Enable Email/Password + Google OAuth
2. **Redirect URLs** → Add `https://ugc-crm-one.vercel.app`
3. **Site URL** → `https://ugc-crm-one.vercel.app`

---

## 9. Build Phases

### Phase A: Auth Core — 1-2 days
- [ ] Supabase Auth setup (Ken configures dashboard)
- [ ] Sign up / Login pages
- [ ] Supabase session management in Next.js middleware
- [ ] Protected routes middleware
- [ ] Auto workspace creation on first sign up
- [ ] RLS policies on all tables

### Phase B: Invite System — 1 day
- [ ] `/invite/[code]` page
- [ ] Generate invite link API
- [ ] Accept invite flow
- [ ] List/remove members in settings

### Phase C: Subscription-Ready — Future
- [ ] Stripe integration
- [ ] Workspace.plan = "free" | "pro"
- [ ] Pro features gated behind plan
- [ ] Checkout flow

---

## 10. Future Payments Model

```
Workspace (tenant)
├── plan: "free" | "pro"
├── stripeCustomerId: string
├── subscriptionStatus: "active" | "past_due" | "cancelled"
└── stripeSubscriptionId: string

Free Tier:
- 1 workspace
- Unlimited videos
- Basic analytics

Pro Tier (future, ~$9-19/mo):
- 1 workspace + guest invites
- Advanced analytics + AI recommendations
- Priority support
```

---

## 11. Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # server-side only
NEXT_PUBLIC_APP_URL="https://ugc-crm-one.vercel.app"
```

---

## 12. Next Steps

1. **Ken sets up Supabase Auth** — Dashboard → Auth → Enable Email + Google
2. **Ken provides Supabase anon/service keys** — I add to Vercel env vars
3. **I build auth system** — sign up, login, invite, RLS
4. **I push to GitHub** — Ken deploys via Vercel

Send me the Supabase anon key and service role key and we'll begin. 🤖
