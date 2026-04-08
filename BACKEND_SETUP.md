# Backend setup for Telegram Mini App

## Why Supabase
- Your project is already on Next.js App Router, so `app/api/*` is the fastest backend integration path.
- Supabase (Postgres) is better than MongoDB here because you need strict uniqueness checks:
  - one topic cannot be taken by two users
  - one user cannot take multiple topics
- SQL constraints in `supabase/schema.sql` enforce these rules reliably.

## 1) Environment variables
Copy `.env.example` to `.env.local` and fill values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ID` (your Telegram numeric user id)
- `TELEGRAM_BOT_TOKEN`
- `CRON_SECRET`

## 2) Database schema
Run SQL from `supabase/schema.sql` in Supabase SQL Editor.
Then run `supabase/seed.sql` to preload your current subjects and topics.

## 3) API endpoints added
- `GET /api/bootstrap`
- `PUT /api/admin/homework`
- `DELETE /api/admin/homework?subject=...`
- `PUT /api/admin/schedule`
- `POST /api/topics/assign`
- `DELETE /api/topics/cancel`
- `PUT /api/notifications/settings`
- `POST /api/cron/deadlines` (protected by `Authorization: Bearer <CRON_SECRET>`)

## 4) Frontend files now using server fetch
- `lib/homework-context.tsx`
  - bootstrap data load
  - save homework topics
  - clear subject topics
  - assign/cancel topic
  - save schedule for date
  - save notification settings
- `components/pages/admin-panel-page.tsx`
  - save now sends `hours` and `minutes` with existing form fields
- `components/pages/admin-calendar-page.tsx`
  - confirm is async and persists schedule
- `components/pages/subject-detail-page.tsx`
  - topic assignment/cancel now await server result
- `app/page.tsx`
  - notification settings are persisted through context API call

## 5) Cron job (24h + 12h reminders)
GitHub Actions workflow is already added:
- `.github/workflows/deadline-cron.yml`
- runs every hour and calls `POST /api/cron/deadlines`

Set repository secrets:
- `APP_BASE_URL` (for example `https://your-app.vercel.app`)
- `CRON_SECRET` (must match `.env.local`)

Header:
- `Authorization: Bearer <CRON_SECRET>`

The route:
- checks assignment + homework deadline
- checks user notification preferences
- sends Telegram message through Bot API
- deduplicates by `notification_logs`

## 6) Telegram initData validation
Server now verifies Telegram Mini App `initData` signature on every protected route.

Required:
- frontend sends `x-telegram-init-data` header (already implemented in `lib/homework-context.tsx`)
- backend has `TELEGRAM_BOT_TOKEN`

Notes:
- fallback header `x-telegram-user-id` is kept only for local development outside Telegram
- max allowed initData age is configured by `TG_INITDATA_MAX_AGE_SEC` (default 86400 seconds)
