# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `trainer-app/`:

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build — runs type-check + ESLint (primary correctness gate)
npm run lint       # ESLint via next lint
npx tsc --noEmit   # Type-check only
```

No test suite. Build is the only gate. Always run `npx tsc --noEmit` after edits before claiming done.

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · MongoDB Atlas (Mongoose) · NextAuth.js v5 · OpenRouter API (`google/gemini-2.5-flash-lite`) · Vercel AI SDK v6 · recharts · jsPDF · Resend · web-push

**Language:** All UI, AI prompts, and output are in Georgian (ქართული).

**GitHub:** `https://github.com/geoaitrainer/geoai`

**PWA:** `public/manifest.json` + `public/icon.svg` + `public/sw.js` (service worker for push notifications). Targets standalone mobile display.

### Auth — NextAuth v5 (JWT, Credentials-only)

- `src/auth.config.ts` — Edge-compatible config. Protected paths: `/dashboard`, `/nutrition`, `/workout`, `/progress`, `/chat`, `/profile`, `/admin`, `/recipes`, `/calendar`.
- `src/auth.ts` — Credentials provider only (bcrypt).
- `session.user.id` = MongoDB `_id.toString()`.

**Admin access:** `Profile.is_admin: true`. `src/app/admin/layout.tsx` redirects non-admins. `PUT /api/profile` strips `is_admin`/`plan`/`userId` — users cannot self-elevate.

### MongoDB / Mongoose

- `src/lib/mongodb/mongoose.ts` — singleton `connectDB()`. Overrides `dns.promises` to `8.8.8.8` (Atlas SRV fix).
- Models in `src/lib/mongodb/models/`: `User`, `Profile`, `MealPlan`, `FoodDiary`, `WorkoutProgram`, `ProgressEntry`, `ChatMessage`, `Task`, `WaterEntry`, `PushSubscription`.
- All models use `userId: String` (not ObjectId refs).
- Always `.lean()` for reads; `JSON.parse(JSON.stringify(doc))` before returning from API routes.
- Active plans: `is_active: Boolean`. Always `updateMany({ userId, type }, { is_active: false })` before inserting a new plan.
- Mongoose strict mode silently drops unknown fields — add new fields to schema before saving.

### Route groups

- `(auth)/` — login, register. Both `export const dynamic = 'force-dynamic'`.
- `(dashboard)/` — Layout calls `auth()`, redirects to `/login` if no session. Pages: `dashboard`, `nutrition`, `nutrition/diary`, `workout`, `progress`, `chat`, `profile`, `calendar`, `recipes`.
- `admin/` — `is_admin` check in layout. Users page supports create (POST) + cascade-delete (DELETE).

### AI pipeline

All calls via **OpenRouter** (`https://openrouter.ai/api/v1`, model `google/gemini-2.5-flash-lite`).

- `src/lib/openai/client.ts` — module-level instantiation. Missing `OPENROUTER_API_KEY` at build time fails the build.
- `src/lib/openai/prompts.ts` — `buildChatSystemPrompt` is **profile-adaptive**: injects goal, BMI, macros, experience, food preferences, and summaries of active meal/workout plans. Each prompt function is named `build*Prompt`.
- `src/lib/openai/safety.ts` — Georgian medical keyword filter, runs before AI call.

| Route | Method | Description |
|---|---|---|
| `/api/ai/chat` | POST stream | `streamText`. Loads Profile + active plans → adaptive system prompt. |
| `/api/ai/meal-plan` | GET/POST | 7 or 30-day meal plan (JSON). |
| `/api/ai/workout-plan` | GET/POST | Gym or home workout program (JSON). |
| `/api/ai/food-lookup` | POST | `{ food_name, amount_g }` → macros. |
| `/api/ai/nutrition-analysis` | GET | Diary analysis for `?date=YYYY-MM-DD`. |
| `/api/ai/recipe` | POST | `{ ingredients }` → full recipe + macros per serving (JSON). |
| `/api/calendar` | GET | Active plans + diary/progress dates for `?month=YYYY-MM`. |
| `/api/tasks` | GET/POST/PATCH/DELETE | Task manager CRUD. |
| `/api/water` | GET/POST/DELETE | Daily water intake. GET: `?date=` → `{ total_ml, entries }`. DELETE resets day. |
| `/api/progress` | GET/POST | Body measurements (weight, waist, chest, biceps). |
| `/api/email/weekly-report` | POST | Sends 7-day summary HTML email via Resend to session user's email. |
| `/api/push` | GET/POST/DELETE | VAPID public key (GET), save subscription (POST), remove (DELETE). |
| `/api/admin/users` | GET/POST/PUT/DELETE | List, create, update plan, cascade-delete users. |
| `/api/admin/stats` | GET | KPIs + 14-day registration/chat trends + plan distribution for charts. |

### Georgian Food Database

`src/data/georgian-foods.ts` — static array of 50+ Georgian foods with `{ name, category, calories, protein_g, fat_g, carbs_g, serving, amount_g }`. `searchGeorgianFoods(query)` returns up to 8 matches. Used in `/nutrition/diary` for offline instant search (no AI needed). AI food-lookup is secondary, for non-Georgian foods.

### Water Tracking

`WaterEntry` model: `{ userId, date (YYYY-MM-DD), amount_ml }`. Dashboard widget `src/components/dashboard/WaterTracker.tsx` — SVG ring, goal 2500ml, quick-add buttons (+200/250/300/500ml).

### Recipe Generator

`/recipes` page + `/api/ai/recipe` — user enters ingredients, AI returns `{ name, servings, prep_minutes, cook_minutes, ingredients[], steps[], nutrition_per_serving, tips }`.

### PDF Export

`src/lib/pdf/export.ts` — client-side only (`'use client'`). Two functions: `exportProgressPDF(name, entries)` and `exportMealPlanPDF(name, days)`. Dynamically imports `jspdf` to avoid SSR issues. Called from progress and nutrition pages.

### Analytics (Admin)

`src/components/admin/AnalyticsCharts.tsx` — client component, fetches `/api/admin/stats`. Renders: KPI cards, 14-day registration bar chart, 14-day AI chat line chart, plan distribution pie chart. All via recharts.

### Email — Resend

`src/lib/email/resend.ts` — lazy singleton `getResend()` (throws if `RESEND_API_KEY` missing at runtime, not build time). `buildWeeklyReportHtml()` produces HTML email. Trigger: POST `/api/email/weekly-report` from progress page.

### Push Notifications

`public/sw.js` — service worker handles `push` event and `notificationclick`. Registered client-side in `PushNotificationSetup.tsx`. VAPID keys in env vars. `PushSubscription` model stores per-user subscription. Setup UI lives on `/profile` page.

### Task Manager

`Task` model: `{ userId, type (nutrition|shopping|workout), title, date (YYYY-MM-DD), completed, order, meta }`.

- `TaskManagerCard.tsx` — Dashboard widget. Nutrition tasks auto-seed from today's meal plan day. Shopping list is persistent.
- `WorkoutChecklist.tsx` — Workout page. Seeds exercises as tasks per `date+day_index`.

### Calendar date mapping

`/calendar` maps plan days to real calendar dates client-side:
- **Meal plan:** `dayIndex = daysSincePlanCreation % plan.days.length`
- **Workout:** within each 7-day cycle, first `days_per_week` days = workout, rest = rest.

### Fitness calculations

`src/lib/calculations/` — `bmr.ts` (Mifflin-St Jeor), `tdee.ts` (BMR × multiplier), `macros.ts` (goal split). `PUT /api/profile` and `POST /api/profile/calculate` recalculate all four.

### Styling

Dark mode: `.dark` on `<html>`, persisted in `localStorage`, set by inline script in `layout.tsx` before hydration. CSS variables in `globals.css`. Custom Tailwind utilities: `card`, `btn-primary`, `input-field`, `label` (`@layer components`).

Mobile nav (`MobileNav.tsx`): 6 items — dashboard, nutrition, calendar, recipes, AI, progress. Dashboard layout: `pb-16 md:pb-0`. Chat: `h-dvh`.

### Key env vars

```
MONGODB_URI            # mongodb+srv://... Atlas SRV
AUTH_SECRET            # 32+ char random — JWT signing
NEXTAUTH_URL           # must match production domain exactly — mismatch breaks session cookies
OPENROUTER_API_KEY     # sk-or-v1-... — missing at build time fails build
NEXT_PUBLIC_APP_URL    # HTTP-Referer sent to OpenRouter
VAPID_PUBLIC_KEY       # web-push VAPID public key
VAPID_PRIVATE_KEY      # web-push VAPID private key
RESEND_API_KEY         # resend.com — missing causes runtime 503, not build failure
```

### Deployment (Vercel)

| Account | Team | Project | Production URL |
|---|---|---|---|
| `geoaitrainer` | `aigeotrainer` (`team_FAb234VDVF8qflYGXQ4rzVsL`) | `trainer-app` (`prj_MMSdFbnzvP2Z5n4EUERNn6SmK08h`) | `https://trainer-app-theta-six.vercel.app` |

Deploy command (non-interactive, requires token):
```bash
npx vercel deploy --prod --yes --scope aigeotrainer --token <VERCEL_TOKEN>
```

Root Directory on Vercel is `trainer-app/`. All env vars are set on the Vercel project (encrypted). When redeploying after env changes, run deploy again — env vars are read at build time.
