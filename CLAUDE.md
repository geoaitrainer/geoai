# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `trainer-app/`:

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build — also runs type-check + ESLint (primary correctness gate)
npm run lint       # ESLint via next lint
npx tsc --noEmit   # Type-check only
```

No test suite. Build is the only gate.

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · MongoDB Atlas (Mongoose) · NextAuth.js v5 · OpenRouter API (google/gemini-2.5-flash-lite) · Vercel AI SDK v6

**Language:** All UI, AI prompts, and output are in Georgian (ქართული).

### Auth — NextAuth v5 (JWT strategy)

- `src/auth.config.ts` — Edge-compatible config (no DB). Used by middleware for route protection via the `authorized` callback.
- `src/auth.ts` — Full Node.js config. Extends `auth.config.ts` with Google OAuth + Credentials provider (bcrypt password check). On first Google sign-in, creates `User` + `Profile` in MongoDB.
- `src/middleware.ts` — exports `NextAuth(authConfig).auth`. Protects `/dashboard`, `/nutrition`, `/workout`, `/progress`, `/chat`, `/profile`, `/admin`. Redirects logged-in users away from `/login` and `/register`.
- Session strategy is JWT. `session.user.id` is MongoDB `_id.toString()`.

**Registration:** `POST /api/auth/register` creates User (bcrypt hash) + Profile, then client calls `signIn('credentials', ...)` automatically.

**Admin access:** controlled by `Profile.is_admin: true`. Admin layout at `src/app/admin/layout.tsx` redirects non-admins to `/dashboard`.

### MongoDB / Mongoose

- `src/lib/mongodb/mongoose.ts` — singleton `connectDB()`. Contains `dns/promises` override forcing `8.8.8.8` — needed for environments where the system DNS blocks MongoDB Atlas SRV lookups.
- Models in `src/lib/mongodb/models/`: `User`, `Profile`, `MealPlan`, `FoodDiary`, `WorkoutProgram`, `ProgressEntry`, `ChatMessage`.
- All models use `userId: String` (`_id.toString()`) as foreign key — not ObjectId refs.
- Use `.lean()` for reads. Serialize with `JSON.parse(JSON.stringify(doc))` before returning from API routes.
- Active plans: `is_active: Boolean`. Always `updateMany({ userId, type }, { is_active: false })` before inserting a new plan.

### Route groups

- `(auth)/` — login, register. Both have `export const dynamic = 'force-dynamic'`.
- `(dashboard)/` — protected pages. Layout calls `auth()` and redirects to `/login` if no session.
- `admin/` — layout checks `Profile.is_admin: true`; non-admins redirect to `/dashboard`.

### AI pipeline

All AI calls use **OpenRouter** (`https://openrouter.ai/api/v1`) with model `google/gemini-2.5-flash-lite`. The client is OpenAI-compatible.

- `src/lib/openai/client.ts` — `openaiClient` (OpenAI SDK pointed at OpenRouter). Used by all non-streaming routes.
- `src/lib/openai/prompts.ts` — all prompt builders. Edit here to change tone, structure, or language.
- `src/lib/openai/safety.ts` — Georgian medical keyword filter. Chat checks this before calling AI.

**Endpoints:**

| Route | Method | Type | Description |
|---|---|---|---|
| `/api/ai/chat` | POST | streaming | Vercel AI SDK `streamText` via `createOpenAI` (OpenRouter). Loads Profile + active plans for context. |
| `/api/ai/meal-plan` | POST | JSON | 7 or 30-day Georgian meal plan. `response_format: json_object`. |
| `/api/ai/workout-plan` | POST | JSON | Gym or home workout program. `response_format: json_object`. |
| `/api/ai/food-lookup` | POST | JSON | Given `{ food_name, amount_g }`, returns `{ calories, protein_g, fat_g, carbs_g }`. |
| `/api/ai/nutrition-analysis` | GET | text | Analyzes today's diary entries and returns Georgian text feedback. Accepts `?date=YYYY-MM-DD`. |
| `/api/progress` | POST | — | Saves progress entry, then fire-and-forget AI review attached to the entry. |

### Fitness calculations

`src/lib/calculations/` — pure functions: `bmr.ts` (Mifflin-St Jeor), `tdee.ts` (BMR × activity multiplier), `macros.ts` (goal-based macro split, floor 1500/1200 kcal). `PUT /api/profile` recalculates all four and persists. `POST /api/profile/calculate` recalculates from existing profile data.

### Instrumentation

`src/instrumentation.ts` — runs once on server start (Node.js runtime only). Currently sets `dns.promises` servers to `8.8.8.8`. Enabled via `experimental.instrumentationHook: true` in `next.config.mjs`.

### Styling

Dark mode: class-based (`.dark` on `<html>`), persisted in `localStorage`. Inline script in `src/app/layout.tsx` sets class before hydration. CSS variables (`--background`, `--card`, `--border`, etc.) in `globals.css`. Custom Tailwind utilities: `card`, `btn-primary`, `input-field`, `label` in `@layer components`.

### Key env vars

```
MONGODB_URI                 # mongodb+srv://... (direct SRV format)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
AUTH_SECRET                 # random 32+ char secret for NextAuth JWT signing
NEXTAUTH_URL                # full URL (http://localhost:3000 or https://...)
OPENROUTER_API_KEY          # sk-or-v1-... from openrouter.ai
NEXT_PUBLIC_APP_URL         # sent as HTTP-Referer header to OpenRouter
```
