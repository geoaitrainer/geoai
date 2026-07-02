# Android App (TWA) — Build & Publish Guide

The site stays a normal Next.js web app on Vercel. The Android app is a **Trusted
Web Activity (TWA)** — a thin native wrapper around the same live URL
(`https://geotraener.vercel.app`). One codebase, one deploy, both platforms. Any
Vercel deploy updates the Android app automatically (no re-submission for content
changes).

## ✅ Signed APK is built and shipped

A signed release APK is already built and committed at `public/app.apk` — the
`/download` page serves it and `assetlinks.json` carries its real fingerprint, so
the installed app runs full-screen (no browser bar). Users can install it today
(after deploy) without Play Store.

- Package: `space.reeducate.trainer`, version 1.0.0 (versionCode 1)
- Signing cert SHA-256: `81:FC:49:17:3A:01:F2:59:5F:C3:B3:AB:B7:E2:DA:E7:D8:7C:FF:DB:6C:4C:3F:5C:36:C7:C9:67:A2:A0:95:89`
- **Keystore: `C:\twa-toolchain\build\android.keystore`** (alias `android`, store/key pass `reeducate2026`). **⚠️ BACK THIS UP** — it is intentionally NOT committed. Losing it means future updates can't be signed with the same key, forcing users to uninstall/reinstall. Never commit it to the repo.
- Toolchain used (local, not committed): `C:\twa-toolchain` (JDK17 + Android SDK 34).

**Rebuild after a version bump** (bump `appVersionCode` in `C:\twa-toolchain\build\twa-manifest.json`):
```
cd C:\twa-toolchain\build
node gen-project.mjs
cmd /c "call app\gradlew.bat -p app assembleRelease --no-daemon"
android-sdk\build-tools\34.0.0\zipalign -f -p 4 app\app\build\outputs\apk\release\app-release-unsigned.apk aligned.apk
android-sdk\build-tools\34.0.0\apksigner sign --ks android.keystore --ks-pass pass:reeducate2026 --key-pass pass:reeducate2026 --out app-release-signed.apk aligned.apk
copy app-release-signed.apk <repo>\public\app.apk
```
Then commit `public/app.apk` and redeploy.

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

## Distribution without Play Console (free)

The `/download` page (`src/app/download/page.tsx`) is a public install hub — a QR
code to open the site on a phone, "Add to Home Screen" (PWA) instructions, and an
APK download button.

- **PWA (zero build):** after deploy, users open the site → Chrome menu → "Add to
  Home Screen". Full-screen, icon, offline — no APK, no store.
- **APK sideload:** build a **Signed APK** (not AAB) in PWABuilder → drop it at
  `public/app.apk` → redeploy. The `/download` button then serves it. Users enable
  "install from unknown sources". Share the link/QR directly (Telegram, etc.).

`public/app.apk` is intentionally absent until you build it — the download button
404s until then.

## Notes
- **Package name** `space.reeducate.trainer` is used in `assetlinks.json`; keep it identical everywhere.
- **Push**: `web-push` already works inside the TWA on Android 13+ (asks notification permission). No FCM change needed for basic push.
- **Updates**: content/logic changes ship via Vercel deploy — no new APK. Rebuild the `.aab` only when the icon, name, or package id changes.
- **iOS**: same PWA installs via Safari "Add to Home Screen"; App Store needs a separate wrapper (Capacitor) — out of scope here.
