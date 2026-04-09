# Backend setup for Telegram Mini App

## Why Supabase
- Your project is already on Next.js App Router, so `app/api/*` is the fastest backend integration path.
- Supabase (Postgres) is better than MongoDB here because you need strict uniqueness checks:
  - one topic cannot be taken by two users within the same subject
  - one user cannot take more than one topic per subject
- SQL constraints in `supabase/schema.sql` enforce these rules reliably.

## 1) Environment variables
Copy `.env.example` to `.env.local` and fill values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ID` (your Telegram numeric user id)
- `TELEGRAM_BOT_TOKEN`

## 2) Database schema
Run SQL from `supabase/schema.sql` in Supabase SQL Editor (or apply migrations under `supabase/migrations/` in order).
Then run `supabase/seed.sql` to preload your current subjects and topics.

## 3) API endpoints
- `GET /api/bootstrap`
- `PUT /api/admin/homework`
- `DELETE /api/admin/homework?subject=...`
- `PUT /api/admin/schedule`
- `POST /api/topics/assign`
- `DELETE /api/topics/cancel?subject=...`

## 4) Frontend files using server fetch
- `lib/homework-context.tsx` — bootstrap, homework, schedule, assign/cancel topic per subject
- `components/pages/admin-panel-page.tsx`
- `components/pages/admin-calendar-page.tsx`
- `components/pages/subject-detail-page.tsx`

## 5) Telegram initData validation
Server verifies Telegram Mini App `initData` signature on protected routes.

Required:
- frontend sends `x-telegram-init-data` header (see `lib/homework-context.tsx`)
- backend has `TELEGRAM_BOT_TOKEN`

Notes:
- fallback header `x-telegram-user-id` is kept only for local development outside Telegram
- max allowed initData age is configured by `TG_INITDATA_MAX_AGE_SEC` (default 86400 seconds)
