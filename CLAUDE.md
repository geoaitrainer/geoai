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

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · MongoDB Atlas (Mongoose) · NextAuth.js v5 · OpenRouter API (`google/gemini-2.5-flash-lite`) · Vercel AI SDK v6

**Language:** All UI, AI prompts, and output are in Georgian (ქართული).

**PWA:** `public/manifest.json` + `public/icon.svg` + `public/icon-maskable.svg`. Targets standalone mobile display. `layout.tsx` exports `metadata` (manifest, appleWebApp) and `viewport` (themeColor).

### Auth — NextAuth v5 (JWT, Credentials-only)

- `src/auth.config.ts` — Edge-compatible config. Used by middleware `authorized` callback.
- `src/auth.ts` — Credentials provider only (bcrypt). Google OAuth was removed.
- `src/middleware.ts` — Protects `/dashboard`, `/nutrition`, `/workout`, `/progress`, `/chat`, `/profile`, `/admin`, `/calendar`. Redirects logged-in users away from `/login`, `/register`.
- `session.user.id` = MongoDB `_id.toString()`.

**Admin access:** `Profile.is_admin: true`. `src/app/admin/layout.tsx` redirects non-admins. `PUT /api/profile` strips `is_admin`/`plan`/`userId` so users cannot self-elevate.

### MongoDB / Mongoose

- `src/lib/mongodb/mongoose.ts` — singleton `connectDB()`. Overrides `dns.promises` to `8.8.8.8` (Atlas SRV fix).
- Models in `src/lib/mongodb/models/`: `User`, `Profile`, `MealPlan`, `FoodDiary`, `WorkoutProgram`, `ProgressEntry`, `ChatMessage`, `Task`.
- All models use `userId: String` (not ObjectId refs).
- Always `.lean()` for reads; serialize with `JSON.parse(JSON.stringify(doc))` before returning from API routes.
- Active plans: `is_active: Boolean`. Always `updateMany({ userId, type }, { is_active: false })` before inserting a new plan.
- Mongoose strict mode silently drops unknown fields — add new fields to schema before saving.

### Route groups

- `(auth)/` — login, register. Both `export const dynamic = 'force-dynamic'`.
- `(dashboard)/` — Layout calls `auth()`, redirects to `/login` if no session. Pages: `dashboard`, `nutrition`, `nutrition/diary`, `workout`, `progress`, `chat`, `profile`, `calendar`.
- `admin/` — `is_admin` check in layout. Users page supports create (POST) + cascade-delete (DELETE).

### Task Manager

`Task` model fields: `userId`, `type` (`nutrition`|`shopping`|`workout`), `title`, `date` (YYYY-MM-DD), `completed`, `order`, `meta` (Mixed).

`/api/tasks` — GET (`?type=&date=`), POST, PATCH (toggle/rename by `id` in body), DELETE (`?id=`).

Client components:
- `src/components/tasks/TaskManagerCard.tsx` — Dashboard widget, tabbed: **🥗 კვების ტასკები** (auto-seeds from today's meal plan day) and **🛒 საყიდლები** (persistent shopping list).
- `src/components/tasks/WorkoutChecklist.tsx` — Workout page widget. Seeds exercises from selected day as checkable tasks per `date+day_index`.

Nutrition tasks auto-seed: fetch `/api/calendar?month=YYYY-MM`, compute `daysSincePlanCreation % days.length`, create one Task per meal + a water task.

### AI pipeline

All calls via **OpenRouter** (`https://openrouter.ai/api/v1`, model `google/gemini-2.5-flash-lite`).

- `src/lib/openai/client.ts` — module-level instantiation. Missing `OPENROUTER_API_KEY` at build time causes `OpenAIError: Missing credentials` during "collect page data" and fails the build.
- `src/lib/openai/prompts.ts` — `buildChatSystemPrompt` contains a **fixed kidney-health/detox protocol** in Georgian. Not profile-adaptive. Injected profile name only.
- `src/lib/openai/safety.ts` — Georgian medical keyword filter, runs before AI call.

| Route | Method | Description |
|---|---|---|
| `/api/ai/chat` | POST stream | Vercel AI SDK `streamText`. Loads Profile + active plans. |
| `/api/ai/meal-plan` | GET/POST | 7 or 30-day meal plan (`response_format: json_object`). |
| `/api/ai/workout-plan` | GET/POST | Gym or home workout program. |
| `/api/ai/food-lookup` | POST | `{ food_name, amount_g }` → `{ calories, protein_g, fat_g, carbs_g }`. |
| `/api/ai/nutrition-analysis` | GET | Diary analysis, accepts `?date=YYYY-MM-DD`. |
| `/api/calendar` | GET | Active plans + diary/progress dates for `?month=YYYY-MM`. |
| `/api/tasks` | GET/POST/PATCH/DELETE | Task manager CRUD. |
| `/api/admin/users` | GET/POST/PUT/DELETE | List, create, update plan, cascade-delete users. |

### Calendar date mapping

`/calendar` page maps plan days to real dates client-side:
- **Meal plan:** `dayIndex = daysSincePlanCreation % plan.days.length`
- **Workout:** within each 7-day cycle from `created_at`, first `days_per_week` days = workout, rest = rest.
- `/nutrition/diary` accepts `?date=YYYY-MM-DD` (calendar deep-link).

### Fitness calculations

`src/lib/calculations/` — `bmr.ts` (Mifflin-St Jeor), `tdee.ts` (BMR × multiplier), `macros.ts` (goal split, floor 1500/1200 kcal). `PUT /api/profile` and `POST /api/profile/calculate` recalculate all four.

### Styling

Dark mode: `.dark` on `<html>`, persisted in `localStorage`, set by inline script in `layout.tsx` before hydration. CSS variables in `globals.css`. Custom Tailwind utilities: `card`, `btn-primary`, `input-field`, `label` (`@layer components`).

Mobile nav (`MobileNav.tsx`): backdrop-blur, `env(safe-area-inset-bottom)`, `h-14` (56px), 6 items. Dashboard layout: `pb-16 md:pb-0`. Chat: `h-dvh`.

### Key env vars

```
MONGODB_URI          # mongodb+srv://... Atlas SRV
AUTH_SECRET          # 32+ char random — JWT signing
NEXTAUTH_URL         # http://localhost:3000 or https://...
OPENROUTER_API_KEY   # sk-or-v1-... from openrouter.ai
NEXT_PUBLIC_APP_URL  # HTTP-Referer sent to OpenRouter
```

### Deployment (Vercel)

**Two separate Vercel projects:**

| Account | Project | Production URL | Deploy command |
|---|---|---|---|
| `goodhomege-dev` (personal) | `trainer-app` | `https://trainer-app-goodhome.vercel.app` | `VERCEL_TOKEN=<goodhome-token> vercel --prod` |
| `trendoramarketplace` (team) | `trainer-app` | `https://trainer-app-trendoramarketplace.vercel.app` | `vercel --prod --scope trendoramarketplace` |

**Primary production site** is the `goodhome` project. To deploy there:
1. Temporarily set `.vercel/project.json` → `{"projectId":"prj_yM1VTfNIHtPeEYZ7t1VoY6uYU6Jp","orgId":"FOZJPHjRqfQaVQSc2eF70yW9","projectName":"trainer-app"}`
2. Run `VERCEL_TOKEN=<goodhome-token> vercel --prod --no-wait`
3. Restore `.vercel/project.json` to trendoramarketplace values.

All 5 env vars must be set on the Vercel project. Missing `OPENROUTER_API_KEY` fails build. `NEXTAUTH_URL` must match the production domain exactly — mismatch silently breaks session cookies.

Deployment Protection (SSO) is enabled on both projects — deployments show `BLOCKED`/`UNKNOWN` in CLI but are live for users with SSO bypass cookie.
