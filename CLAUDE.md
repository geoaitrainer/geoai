# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root (same directory as `package.json`):

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build — runs type-check + ESLint (primary correctness gate)
npm run lint       # ESLint via next lint
npx tsc --noEmit   # Type-check only
```

No test suite. Build is the only gate. Always run `npx tsc --noEmit` after edits before claiming done.

**Deploy (requires token):**
```bash
npx vercel link --yes --scope aigeotrainer --token <TOKEN>
npx vercel deploy --prod --yes --token <TOKEN>
npx vercel env add <NAME> production --token <TOKEN>   # add env var non-interactively via echo pipe
```

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · MongoDB Atlas (Mongoose) · NextAuth.js v5 · OpenRouter API (`google/gemini-2.5-flash-lite`) · Vercel AI SDK v6 + zod (structured output) · recharts · jsPDF · Resend · nodemailer (Gmail) · web-push · lucide-react

**Language:** All UI, AI prompts, and output are in Georgian (ქართული).

**GitHub:** `https://github.com/geoaitrainer/geoai`

**PWA:** `public/manifest.json` + `public/icon.svg` + `public/sw.js` (service worker for push notifications). Targets standalone mobile display.

### Auth — NextAuth v5 (JWT, Credentials-only)

- `src/auth.config.ts` — Edge-compatible config. Protected paths: `/dashboard`, `/nutrition`, `/workout`, `/progress`, `/chat`, `/profile`, `/admin`, `/recipes`, `/calendar`. Auth pages (not redirected when logged in): `/login`, `/register`, `/admin-login`, `/forgot-password`.
- `src/auth.ts` — Credentials provider. Two paths:
  - **Normal:** `email` + `password` → bcrypt compare
  - **Admin OTP:** `email` + `adminOtp` → validates `AuthToken` (type `admin_otp`, not used, not expired)
- `session.user.id` = MongoDB `_id.toString()`.

**Admin access:** `Profile.is_admin: true`. `src/app/admin/layout.tsx` redirects non-admins. `PUT /api/profile` strips `is_admin`/`plan`/`userId` — users cannot self-elevate.

**First-time admin setup:** `POST /api/setup-admin` with `{ email, secret }`. Requires `ADMIN_SETUP_SECRET` env var — **no hardcoded fallback**; endpoint returns 403 "Setup disabled" if the env var is unset.

**Password reset flow:** `POST /api/auth/forgot-password` → checks user exists → saves `AuthToken` (type `password_reset`, 1h TTL) → sends Gmail link. `POST /api/auth/reset-password` → validates token → bcrypt hashes new password → marks token used.

**Admin OTP flow:** `POST /api/auth/admin-otp` → checks user exists + `Profile.is_admin` → deletes old OTPs → generates 6-digit OTP using `crypto.randomInt` → saves `AuthToken` (type `admin_otp`, 10min TTL) → sends Gmail. Verify via `signIn('credentials', { email, adminOtp })`.

### MongoDB / Mongoose

- `src/lib/mongodb/mongoose.ts` — singleton `connectDB()`. Overrides `dns.promises` to `8.8.8.8` (Atlas SRV fix).
- Models in `src/lib/mongodb/models/`: `User`, `Profile`, `MealPlan`, `FoodDiary`, `WorkoutProgram`, `ProgressEntry`, `ChatMessage`, `Task`, `WaterEntry`, `PushSubscription`, `AuthToken`.
- All models use `userId: String` (not ObjectId refs).
- Always `.lean()` for reads; `JSON.parse(JSON.stringify(doc))` before returning from API routes.
- Active plans: `is_active: Boolean`. Always `updateMany({ userId, type }, { is_active: false })` before inserting a new plan.
- Mongoose strict mode silently drops unknown fields — add new fields to schema before saving.

**`AuthToken` model:** `{ email, token, type ('password_reset'|'admin_otp'), expiresAt, used }`. TTL index on `expiresAt` (`expireAfterSeconds: 0`) — MongoDB auto-deletes expired tokens.

### Route groups

- `(auth)/` — `login`, `register`, `forgot-password`, `reset-password`, `admin-login`. All `export const dynamic = 'force-dynamic'`.
- `(dashboard)/` — Layout calls `auth()`, redirects to `/login` if no session. Pages: `dashboard`, `nutrition`, `nutrition/diary`, `workout`, `progress`, `chat`, `profile`, `calendar`, `recipes`.
- `admin/` — `is_admin` check in layout. Users page supports create (POST) + cascade-delete (DELETE).

**Route loading states:** Co-located `loading.tsx` with `.skeleton` CSS class. See `src/app/(dashboard)/dashboard/loading.tsx` for the pattern.

### AI pipeline

All calls via **OpenRouter** (`https://openrouter.ai/api/v1`, model `google/gemini-2.5-flash-lite`).

- `src/lib/openai/client.ts` — module-level instantiation. Missing `OPENROUTER_API_KEY` at build time fails the build.
- `src/lib/openai/prompts.ts` — all `build*Prompt` functions. `buildChatSystemPrompt` is profile-adaptive. `getWorkoutSplit` picks the split by experience (Full Body 3x / Upper-Lower 4x / PPL 6x).
- `src/lib/openai/safety.ts` — Georgian medical keyword filter, runs before AI call. **Do not add culinary/nutrition words** (e.g. `რეცეპტი`) — they falsely block the recipe/meal features.

**⚠️ Generation is multi-call to beat the model's ~8k output-token cap** (single-shot rich JSON always truncated → `finish_reason: length` → parse failure). See below. Every AI route parses inside try/catch and treats truncation as a clean 502.

| Route | Method | Description |
|---|---|---|
| `/api/ai/chat` | POST stream | `streamText`. Loads Profile + active plans → adaptive system prompt. |
| `/api/ai/meal-plan` | GET/POST | 7 or 30-day plan. **Generates each day separately** (`buildSingleDayMealPrompt`, bounded concurrency 6, one retry) then one `buildMealSummaryPrompt` call aggregates ingredients → shopping list + clinical notes. Fails 502 if <half the days succeed. 20s per-type cooldown (429). `maxDuration = 300`. |
| `/api/ai/workout-plan` | GET/POST | Gym or home program. **Shell + per-day:** `buildWorkoutShellPrompt` (metadata + 7 day headers, no exercises) → each workout day's exercises filled in parallel via `buildWorkoutDayPrompt` (execution_details per exercise). 20s cooldown. `maxDuration = 300`. |
| `/api/ai/food-lookup` | POST | `{ food_name }` → macros per 100g (client scales by amount). |
| `/api/ai/nutrition-analysis` | GET | Diary analysis for `?date=YYYY-MM-DD`. |
| `/api/ai/recipe` | POST | `{ ingredients }` → recipe + macros. Uses **AI SDK `generateObject` + zod schema** (not `openaiClient`); `createOpenAI` with OpenRouter baseURL; `maxOutputTokens: 2000`; personalization from server-side Profile. |
| `/api/auth/forgot-password` | POST | Check user exists → send Gmail reset link. |
| `/api/auth/reset-password` | POST | Validate token → update password. |
| `/api/auth/admin-otp` | POST | Check admin → send 6-digit OTP via Gmail. |
| `/api/cron/daily-email` | GET | Vercel Cron (06:00 UTC = 10:00 Tbilisi). Sends daily meal+workout plan to all users. Auth: `Authorization: Bearer ${CRON_SECRET}` (skip in `NODE_ENV=development`). |
| `/api/calendar` | GET | Active plans + diary/progress dates for `?month=YYYY-MM`. |
| `/api/tasks` | GET/POST/PATCH/DELETE | Task manager CRUD. `meta` field is `Mixed` — workout tasks store `{ day_index, sets, reps, weight_used }`. |
| `/api/water` | GET/POST/DELETE | Daily water intake. |
| `/api/progress` | GET/POST | Body measurements. |
| `/api/email/weekly-report` | POST | Sends 7-day summary via Resend. |
| `/api/push` | GET/POST/DELETE | Web push subscription management. |
| `/api/admin/users` | GET/POST/PUT/DELETE | User management. |
| `/api/admin/stats` | GET | KPIs + charts data. |

### Workout Plan — NSCA CSCS System

Two-stage generation (`getWorkoutSplit` + `buildWorkoutShellPrompt` + `buildWorkoutDayPrompt`) enforces:
- **Split by experience:** beginner → Full Body 3x, intermediate → Upper/Lower 4x, advanced → PPL 6x
- **Compound-first:** multi-joint movements before isolation every session
- **Periodization:** Accumulation (kw.1-2, RPE 7, RIR 3) → Intensification (kw.3, RPE 8-9, RIR 1-2) → Deload (kw.4, 50% volume)
- **Per-exercise fields:** `is_compound`, `rpe` (1-10), `rir`, `tempo` ("3-1-2-0"), `weight_suggestion`, and `execution_details` (`setup`, `technique_steps[]`, `target_sensation`, `safety_errors`) — rendered as a collapsible technique guide in `workout/page.tsx`.
- **All 7 days** in `days[]` with `is_rest: true/false`. Rest days have `rest_activities[]`.
- **Program fields:** `split_type`, `deload_week`, `days_per_week`, `duration_weeks`

Meal plan mirrors this: `Meal.alternatives` is `MealAlternative[]` (objects with macros, not strings), `ShoppingItem.estimated_price_gel`, and top-level `clinical_and_lifestyle_notes`.

`WorkoutChecklist.tsx` supports per-exercise weight logging stored in `task.meta.weight_used`.

### Email

Two email providers:

**Nodemailer (Gmail)** — `src/lib/email/nodemailer.ts`. Used for: password reset, admin OTP, daily plan email. `nodemailer` must be in `serverComponentsExternalPackages` in `next.config.mjs` (uses Node.js `net`/`tls` built-ins). `web-push` is in that list too (pulls `asn1.js`, which webpack cannot bundle — a corrupted/partial `asn1.js` install missing `pem.js` breaks the build; `asn1.js` is pinned directly in `package.json` to guard against this).

**Resend** — `src/lib/email/resend.ts`. Used for: weekly nutrition report only.

### Vercel Cron Job

`vercel.json` at repo root defines cron: `GET /api/cron/daily-email` at `0 6 * * *` (10:00 Tbilisi). Iterates all `User` documents → for each user fetches active `MealPlan` + `WorkoutProgram` → calculates today's day index → sends HTML email via Gmail. `CRON_SECRET` env var required in production (Vercel sets it automatically after first deploy with `vercel.json`).

### Calendar date mapping

- **Meal plan:** `dayIndex = floor((now - createdAt) / 86400000) % days.length`
- **Workout:** `cycleDay = daysSince % days.length` (the `days[]` array holds all 7 days including rest, so this is `% 7`); the day's own `is_rest` flag decides rest vs workout — do **not** re-derive rest from `days_per_week`.

### Georgian Food Database

`src/data/georgian-foods.ts` — 50+ Georgian foods. `searchGeorgianFoods(query)` returns up to 8 matches. Used in `/nutrition/diary` for instant offline search.

### Fitness calculations

`src/lib/calculations/` — `bmr.ts` (Mifflin-St Jeor), `tdee.ts` (BMR × activity multiplier), `macros.ts` (goal-based split). Triggered by `PUT /api/profile` and `POST /api/profile/calculate`.

### PDF Export

`src/lib/pdf/export.ts` — client-side only (`'use client'`). Dynamically imports `jspdf`. `exportProgressPDF` + `exportMealPlanPDF`.

### Styling

Dark mode: `.dark` on `<html>`, persisted in `localStorage`, set by inline script in `layout.tsx` before hydration.

**Design tokens** (`globals.css` CSS variables): `--background`, `--foreground`, `--card`, `--border`, `--muted`, `--muted-foreground`. Semantic: `--destructive`, `--success`, `--warning`, `--info` (each with `-foreground` and `-muted` variants). Use semantic variables for state colors — not bare Tailwind classes.

**Skeleton loading:** `.skeleton` class → `bg-[var(--muted)] rounded animate-skeleton`. Use in `loading.tsx` files.

**Icons:** `lucide-react` everywhere in nav/UI. No emoji in `Sidebar.tsx` or `MobileNav.tsx`.

**PostCSS:** `postcss.config.js` (CommonJS). If CSS 404s in dev → delete `.next/` and restart.

**Mobile nav** (`MobileNav.tsx`): 5 items, hidden on `md+`. **Sidebar** (`Sidebar.tsx`): 8 items, visible on `md+`.

### Key env vars

```
MONGODB_URI            # mongodb+srv://... Atlas SRV
AUTH_SECRET            # 32+ char random — JWT signing
NEXTAUTH_URL           # must match production domain exactly
OPENROUTER_API_KEY     # missing at build time fails build
NEXT_PUBLIC_APP_URL    # HTTP-Referer sent to OpenRouter
GMAIL_USER             # geoaitrainer@gmail.com
GMAIL_APP_PASSWORD     # Gmail app password (no spaces) — nodemailer auth
VAPID_PUBLIC_KEY       # web-push
VAPID_PRIVATE_KEY      # web-push
RESEND_API_KEY         # weekly report only — missing causes runtime 503
CRON_SECRET            # Vercel sets automatically; protects /api/cron/daily-email
ADMIN_SETUP_SECRET     # required for /api/setup-admin — no fallback; unset = endpoint disabled
```

### Deployment (Vercel)

| Account | Team | Project | Production URL |
|---|---|---|---|
| `geoaitrainer` | `aigeotrainer` (`team_FAb234VDVF8qflYGXQ4rzVsL`) | `trainer-app` (`prj_MMSdFbnzvP2Z5n4EUERNn6SmK08h`) | `https://geotraener.vercel.app` |

CLI is authenticated as `trendorage-7009` (different account) — always pass `--token <VERCEL_TOKEN>` for `aigeotrainer` operations. Root Directory on Vercel = repo root.
