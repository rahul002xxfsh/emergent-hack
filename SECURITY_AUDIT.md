# Security audit · Celebrity Persona Therapist

Audited 2026-11-19 against the team checklist. The site has **no login, no user accounts, no database and no admin page**, so several items do not apply. Each is marked below.

## Secrets & credentials
- **Hide API keys: done.** The only key in use is `FISH_API_KEY`. It lives in `web/.env.local` (gitignored) and in Vercel's encrypted env vars, and is read only on the server (`/api/voice`). Scans found no key in tracked files, in the whole git history, or in the JavaScript sent to browsers (local build and live site). The unused Magic Hour and AnyToSpeech keys were deleted from `.env.local` and Vercel. Revoke them on those providers too.
- **Passwords off GitHub: done.** No passwords or `.env` files are tracked; `.gitignore` covers `.env*` (only `.env.example` with empty values is committed).
- **Hash passwords: not applicable.** There is no login or password storage.

## Access control & data
- **Proper login / lock admin page / users see only their data / lock the database: not applicable.** There are no accounts, no admin area and no database. Chats live only in the visitor's browser tab and are never stored on the server.

## Network & forms
- **Check every form: done.** All 3 API routes (`/api/chat`, `/api/prescription`, `/api/voice`) validate input with zod (`web/lib/guard.ts`): known persona and topic, only user/assistant roles, message and list size caps, voice text 1–1200 characters. Bad input gets a plain `400 invalid_request`. The chat box also caps input at 250 words.
- **Stop spam: done.** Per-visitor rate limits: chat 20/min, voice 15/min, prescription 8/min, with `429` + `Retry-After` after that. This protects the Fish voice credits. It is best effort per server instance; Vercel's firewall can add a global rule if needed.
- **HTTPS everywhere: done.** Vercel serves HTTPS only. Added HSTS (2 years), plus clickjacking protection (`frame-ancestors 'none'`, `X-Frame-Options: DENY`), `nosniff`, a strict referrer policy, and a permissions policy (mic for this site only; camera, location and payments off). The `X-Powered-By` header is removed.

## Production & maintenance
- **Unused code: done.** Removed the old cartoon avatars, 5 default Next.js icons, 5 unused voice clips (Dwight, Gordon Ramsay, Ashneer), the old voice-provider code and the demo component with `console.log` calls. `@types/three` moved to dev dependencies.
- **Debug mode: done.** Production build only, Next dev indicator off, no browser source maps, no debug logging in the browser.
- **Error details: done.** APIs return short codes (`invalid_request`, `voice_unavailable`, `too_many_requests`), never stack traces, provider responses or internal error codes. Server-side logs keep only a short error category.
- **Update packages: done.** `npm audit` reports **0 vulnerabilities**. A patched PostCSS is pinned via `overrides` (Next 15 bundled a vulnerable copy; Next 16 would be a breaking upgrade). React 19.3.1 and Spline runtime 2.0.198 updated.
- **Daily backups: not applicable for data.** There is no database. Code is backed up on GitHub (private repo), and every Vercel deployment is kept and can be rolled back.
- **Full security check: done.** This document. Re-run `npm audit` and the key scan before the final demo.
