# Mobile App Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Georgian fitness PWA feel like a native mobile app — smooth transitions, haptic feedback, install prompt, swipe gestures, pull-to-refresh, and section-coded color system.

**Architecture:** New independent utility/component files created first (Phase 1), then wired into existing pages and layouts (Phase 2). Dashboard pull-to-refresh uses a client wrapper injected at layout level, keeping the server component data-fetching pattern intact.

**Tech Stack:** Next.js 14 App Router · TypeScript · TailwindCSS · lucide-react · Web APIs (vibrate, beforeinstallprompt, touch events)

## Global Constraints

- All UI text in Georgian (ქართული)
- Dark mode via `.dark` class on `<html>`
- CSS variables: `var(--background)`, `var(--card)`, `var(--border)`, `var(--muted)`, `var(--muted-foreground)`, `var(--primary-500/600)`
- Utility classes: `.card`, `.btn-primary`, `.skeleton`, `.animate-fade-in`, `.animate-slide-up`
- No test suite — `npm run build` is the correctness gate; run `npx tsc --noEmit` after edits
- Do NOT add new npm packages

---

## File Map

**Create:**
- `src/components/pwa/InstallBanner.tsx` — PWA install prompt floating above mobile nav
- `src/lib/haptic.ts` — navigator.vibrate() wrapper with named patterns
- `src/components/ui/PullToRefresh.tsx` — touch pull gesture with rotation indicator
- `src/hooks/useSwipe.ts` — horizontal swipe detection hook
- `src/components/layout/PageTransition.tsx` — client wrapper that re-mounts on route change for slide-in
- `src/app/(dashboard)/DashboardClientWrapper.tsx` — client component providing pull-to-refresh at layout level

**Modify:**
- `src/app/layout.tsx` — add `<InstallBanner />`
- `src/app/globals.css` — page transition keyframe + `.animate-page`, section color accents, gradient variable
- `tailwind.config.ts` — extend colors: workout (orange), progress (blue), chat (purple), calendar (teal)
- `src/app/(dashboard)/layout.tsx` — wrap `<main>` with `DashboardClientWrapper`
- `src/app/(dashboard)/nutrition/page.tsx` — swipe on day selector, haptic on key actions
- `src/app/(dashboard)/dashboard/page.tsx` — section colors on QuickAction cards

---

## Phase 1: New Files (parallel)

### Task 1: InstallBanner
**File:** `src/components/pwa/InstallBanner.tsx`

- [ ] Create component that listens for `beforeinstallprompt` event
- [ ] Persist dismissed state in `localStorage` key `pwa-dismissed`
- [ ] Render: Download icon + "დამატება მთავარ ეკრანზე" + "გამოიყენე სრული app-ის სახით" subtitle + "დაამატე" btn-primary + X dismiss
- [ ] Position: `fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-40`
- [ ] Styles: `.card shadow-lg border-primary-500 border animate-slide-up`
- [ ] Export named `InstallBanner`

### Task 2: Haptic utility
**File:** `src/lib/haptic.ts`

- [ ] `export function haptic(type: 'light'|'medium'|'heavy'|'success' = 'light'): void`
- [ ] Guard: `if (!('vibrate' in navigator)) return`
- [ ] Patterns: light=10, medium=20, heavy=40, success=[10,50,10]

### Task 3: PullToRefresh component
**File:** `src/components/ui/PullToRefresh.tsx`

- [ ] `'use client'` · Props: `{ onRefresh: () => Promise<void>; children: React.ReactNode }`
- [ ] `THRESHOLD = 80` px
- [ ] Track `startY` with `useRef`; only activate when `window.scrollY === 0` and delta > 0
- [ ] Show `RefreshCw` (lucide) centered, rotating `(pullY/THRESHOLD)*360deg`, `animate-spin` when refreshing
- [ ] Height of indicator div transitions with pullY (max THRESHOLD+20px)
- [ ] Export named `PullToRefresh`

### Task 4: useSwipe hook
**File:** `src/hooks/useSwipe.ts`

- [ ] `export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 50)`
- [ ] Returns `{ onTouchStart, onTouchEnd }` — both `(e: React.TouchEvent) => void`
- [ ] `useCallback` for both; `useRef` for startX

### Task 5: PageTransition wrapper
**File:** `src/components/layout/PageTransition.tsx`

- [ ] `'use client'` · `usePathname()` from next/navigation
- [ ] Return `<div key={pathname} className="animate-page flex-1 flex flex-col">{children}</div>`
- [ ] Export named `PageTransition`

### Task 6: DashboardClientWrapper
**File:** `src/app/(dashboard)/DashboardClientWrapper.tsx`

- [ ] `'use client'` · `useRouter()` from next/navigation
- [ ] Wrap children in `<PullToRefresh onRefresh={async () => { router.refresh() }}>`
- [ ] Export named `DashboardClientWrapper`

---

## Phase 2: Integration (parallel)

### Task 7: CSS + Colors
**Modify:** `src/app/globals.css` + `tailwind.config.ts`

globals.css additions:
- [ ] `--primary-gradient: linear-gradient(135deg, #22c55e 0%, #059669 100%)` in both `:root` and `.dark`
- [ ] `@keyframes pageSlideIn { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`
- [ ] `.animate-page { animation: pageSlideIn 0.22s ease-out; }` in `@layer utilities`

tailwind.config.ts additions (inside `extend.colors`):
- [ ] `workout: { DEFAULT: '#f97316', dark: '#ea580c', light: '#fed7aa' }`
- [ ] `progress: { DEFAULT: '#3b82f6', dark: '#2563eb', light: '#dbeafe' }`
- [ ] `chat: { DEFAULT: '#8b5cf6', dark: '#7c3aed', light: '#ede9fe' }`
- [ ] `calendar: { DEFAULT: '#14b8a6', dark: '#0f766e', light: '#ccfbf1' }`

### Task 8: Root layout
**Modify:** `src/app/layout.tsx`

- [ ] Import `InstallBanner` from `@/components/pwa/InstallBanner`
- [ ] Add `<InstallBanner />` before `</body>`

### Task 9: Dashboard layout
**Modify:** `src/app/(dashboard)/layout.tsx`

- [ ] Import `DashboardClientWrapper` and `PageTransition`
- [ ] Wrap `<main>` content with `<DashboardClientWrapper>` and inner `<PageTransition>`

### Task 10: Nutrition page swipe + haptic
**Modify:** `src/app/(dashboard)/nutrition/page.tsx`

- [ ] Import `useSwipe` from `@/hooks/useSwipe`, `haptic` from `@/lib/haptic`
- [ ] Day selector: apply `useSwipe` — swipe left = next day, swipe right = prev day; both call `haptic('light')`
- [ ] Day buttons onClick: `haptic('light')`
- [ ] Generate button onClick: `haptic('medium')`
- [ ] On successful plan generation: `haptic('success')`
- [ ] Wrap day selector in `relative` div, add right-side gradient fade: `<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />`

### Task 11: Dashboard section colors
**Modify:** `src/app/(dashboard)/dashboard/page.tsx`

- [ ] `QuickAction` gets optional `iconClass` and `hoverBorder` props
- [ ] Nutrition link: `iconClass="text-primary-500"` `hoverBorder="hover:border-primary-500"`
- [ ] Workout link: `iconClass="text-workout"` `hoverBorder="hover:border-workout"`
- [ ] Progress link: `iconClass="text-progress"` `hoverBorder="hover:border-progress"`
- [ ] Chat link: `iconClass="text-chat"` `hoverBorder="hover:border-chat"`

---

## Verification

```bash
npx tsc --noEmit   # no type errors
npm run build      # clean build
```

Manual checks:
- Open on mobile (or DevTools mobile): bottom nav visible, 5 items, Lucide icons
- Navigate between pages: slide-in animation visible
- On Android: tap buttons → subtle vibration
- Chrome Android → add to home screen prompt appears after ~5 seconds
- Nutrition page: swipe left/right on day selector changes day
- Pull down on dashboard/nutrition: refresh indicator spins
