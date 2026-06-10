# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `trainer-app/`:

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build (also runs type-check + lint)
npm run lint       # ESLint via next lint
npx tsc --noEmit   # Type-check only, no output
```

No test suite is configured. Build is the primary correctness gate.

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Supabase (auth + DB + storage) · OpenAI API · Vercel AI SDK v6

### Route groups

- `(auth)/` — login, register. Both have `export const dynamic = 'force-dynamic'` to prevent static prerender. Supabase client is created inside handlers (not at component top level) to avoid build-time URL validation failures.
- `(dashboard)/` — all protected pages. Layout does server-side auth check and redirects to `/login` if no session. Includes sidebar + mobile nav.
- `admin/` — separate from `(dashboard)`. Layout checks `profiles.is_admin === true`; non-admins redirect to `/dashboard`.

### Auth flow

Middleware (`src/middleware.ts`) protects routes and does cookie refresh. It checks `is_admin` from the `profiles` table for `/admin/*`. OAuth callback at `/api/auth/callback` auto-creates a profile row for new Google users.

### Supabase clients

Three clients, all in `src/lib/supabase/`:
- `client.ts` — browser (`createBrowserClient`), used in `'use client'` components
- `server.ts` — server (`createServerClient` with cookie jar), used in Server Components and API routes
- `admin.ts` — service-role client, bypasses RLS, for admin API routes only

### AI pipeline

**Chat** (`/api/ai/chat`): loads profile + active meal plan + active workout in parallel → builds Georgian system prompt → calls `streamText` → returns `toTextStreamResponse()`. Saves messages to `chat_messages` table. Runs a medical keyword safety check before calling OpenAI; blocked queries return `SAFETY_RESPONSE` from `src/lib/openai/safety.ts`.

**Meal plan / workout plan generation** (`/api/ai/meal-plan`, `/api/ai/workout-plan`): non-streaming, uses `openai.chat.completions.create` with `response_format: { type: 'json_object' }`. Deactivates old plans before inserting new one.

**Prompts** live entirely in `src/lib/openai/prompts.ts` — all output is in Georgian. Changing tone, language, or meal-plan structure means editing these functions.

### Calculations

`src/lib/calculations/` contains pure functions:
- `bmr.ts` — Mifflin-St Jeor formula
- `tdee.ts` — BMR × activity multiplier
- `macros.ts` — goal-based macro split with calorie floor (1500 kcal men / 1200 kcal women)

`PUT /api/profile` recalculates and persists all four values on every profile save.

### Database

Schema is in `database/schema.sql` — run once in Supabase SQL Editor. All tables have RLS enabled; every table has an `own_data` policy (`user_id = auth.uid()`). Calculated fields (`bmr`, `tdee`, `calorie_goal`, `protein_g`, `fat_g`, `carbs_g`) are stored on `profiles` and updated via `POST /api/profile/calculate` or `PUT /api/profile`.

Active meal/workout plans are toggled via `is_active` boolean (old plans set to `false` before inserting new).

### Styling

Dark mode is class-based (`.dark` on `<html>`). Theme persists in `localStorage`; an inline script in `src/app/layout.tsx` sets the class before hydration to prevent flash. CSS variables (`--background`, `--card`, `--border`, etc.) are defined for both themes in `globals.css`. Custom utility classes (`card`, `btn-primary`, `input-field`, `label`) are in `@layer components`.

### Key env vars

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server/admin only
OPENAI_API_KEY
```
