# QuranReview

## Overview
QuranReview is a vanilla-JS PWA (no framework, native ES Modules) for Quran memorization and review. There is no build step — `frontend/` is served as static files as-is.

## Architecture
- `frontend/` — the static site (this is what runs on Replit). Entry point: `frontend/index.html` → `frontend/src/main.js`.
- `backend/` referenced in project docs (Django/DRF on Vercel) is **not** part of this Replit setup — the frontend talks directly to the production API at `https://quranreview-api.vercel.app` (see `frontend/src/core/config.js`) and to Supabase.
- Supabase anon key / URL are public client keys embedded in the frontend code (see `frontend/src/services/auth.js`), consistent with the original project setup.

## Running on Replit
- Workflow "Start application" runs: `python -m http.server 5000 --directory frontend`
- No npm install / build required to view the UI.
- The dev tooling in `package.json` (vitest, eslint, playwright, etc.) is unrelated to running the app and untouched.

## Notes
- The app is a frontend-only client on Replit; it depends on the external Vercel API and Supabase being reachable and online for login/data features to work.
