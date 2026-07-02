# Android App (TWA) — Build & Publish Guide

The site stays a normal Next.js web app on Vercel. The Android app is a **Trusted
Web Activity (TWA)** — a thin native wrapper around the same live URL
(`https://geotraener.vercel.app`). One codebase, one deploy, both platforms. Any
Vercel deploy updates the Android app automatically (no re-submission for content
changes).

## What's already done in this repo (PWA / Store-readiness)

- PNG icons: `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (regenerate with `node scripts/gen-icons.mjs`)
- `public/manifest.json` — PNG icons, `id`, `display_override`, shortcuts
- `public/.well-known/assetlinks.json` — Digital Asset Links (**fingerprint placeholder — see step 4**)
- `public/sw.js` — offline shell + static caching + web push; `public/offline.html` fallback
- `next.config.mjs` — serves `assetlinks.json` as `application/json`, `Service-Worker-Allowed: /`
- `src/middleware.ts` — `.well-known`, `manifest.json`, `sw.js` excluded from auth
- Global service-worker registration in `InstallBanner`

## Human-only steps (cannot be automated here)

### 0. Deploy the site (prerequisite)
```
npx vercel deploy --prod --yes --token <VERCEL_TOKEN>
```
Confirm `https://geotraener.vercel.app/manifest.json` and
`https://geotraener.vercel.app/.well-known/assetlinks.json` load.

### 1. Generate the Android package — PWABuilder (easiest)
1. Open https://www.pwabuilder.com → enter `https://geotraener.vercel.app`
2. **Package for stores → Android → Generate**
3. Package id: `space.reeducate.trainer` (must match `assetlinks.json`)
4. Download the zip → contains `app-release-signed.aab`, `signing-key-info.txt`, and an `assetlinks.json`

**Alternative — Bubblewrap CLI** (needs JDK 17 + Android SDK; this machine has JDK 8, so upgrade first):
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://geotraener.vercel.app/manifest.json
bubblewrap build
```

### 2. Wire up Digital Asset Links (removes the browser URL bar)
1. From PWABuilder output (or `keytool -list -v -keystore <key>`) copy the **SHA-256 fingerprint**
2. Paste it into `public/.well-known/assetlinks.json`, replacing
   `REPLACE_WITH_SHA256_FROM_PWABUILDER_OR_PLAY_CONSOLE`
3. Commit + redeploy. Verify:
   `https://developers.google.com/digital-asset-links/tools/generator`
   (or open the URL — it must return the JSON with your real fingerprint)

> If the fingerprint is wrong/missing, the app still runs but shows a Chrome
> address bar at the top ("custom tab" look) instead of full-screen.

### 3. Publish to Google Play
1. Google Play Console — one-time **$25** developer registration (ID verification, ~1–2 days)
2. Create app → upload the `.aab`
3. When Play re-signs the app, it gives you a **new App-signing SHA-256** — add
   that fingerprint to `assetlinks.json` too (keep both), redeploy
4. Fill listing (Georgian): title, description, screenshots (phone), privacy
   policy URL, data-safety form → submit for review

## Notes
- **Package name** `space.reeducate.trainer` is used in `assetlinks.json`; keep it identical everywhere.
- **Push**: `web-push` already works inside the TWA on Android 13+ (asks notification permission). No FCM change needed for basic push.
- **Updates**: content/logic changes ship via Vercel deploy — no new APK. Rebuild the `.aab` only when the icon, name, or package id changes.
- **iOS**: same PWA installs via Safari "Add to Home Screen"; App Store needs a separate wrapper (Capacitor) — out of scope here.
