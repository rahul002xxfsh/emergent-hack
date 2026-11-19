# SSB x Emergent Hackathon: Project Log

Every change Claude makes in this folder is recorded here, newest first.

## Current status
- **Date:** Nov 18, 2026 (kick-off day)
- **Selected idea:** Celebrity Persona Therapist (from the shared list, type: Both)
- **Problem statement:** small daily stress, no fun way to vent; generic bots feel flat (see `ONE_PAGER.md`)
- **Solution approach:** 6 parody voice personas + Session Prescription card
- **Product flow:** pick persona → greeting → vent (voice/text) → in-character replies → End Session → prescription card → share
- **Team:** BakBak Bots (6 members)
- **Live website:** https://emergent-hack.vercel.app
- **Code:** https://github.com/rahul002xxfsh/emergent-hack (private)
- **One-pager:** complete in `ONE_PAGER.pdf` / `ONE_PAGER.docx`, based on the team's edited version (due morning of Nov 19, 25%)
- **Prototype:** not started (50%)
- **Presentation:** not started (25%)
- **Social posts (LinkedIn + X, every member):** not started (podium gate)

## Files in this folder
| File | Purpose |
|---|---|
| `HACKATHON_LOG.md` | This running log of all changes and decisions |
| `CLAUDE.md` | Tells Claude to keep this log updated |
| `ONE_PAGER.md` | Detailed notes version: every form + qwen.md field filled for the Celebrity Persona Therapist |
| `ONE_PAGER.pdf` | **The submission one-pager**: the 1811 Labs form filled in, same layout (made from `ONE_PAGER_FORM.html`) |
| `ONE_PAGER.docx` | Word version of the filled form (same table layout, yellow cells), editable |
| `ONE_PAGER_FORM.html` | Editable source of the filled form; re-print to PDF after edits |
| `personas.json` | 6 parody therapist personas for the Emergent build brief |
| `web/` | Next.js website prototype: landing page + working text/voice chat, edge-case rules, stress meter, prescription card. Run: `cd web && npm run build && npm start -- -p 3100` (fast) or `npm run dev` (live editing) |

## Change log

### 2026-11-19 (prescription locked until the session ends)
- `web/components/landing.tsx`: the Session Prescription card is blurred with a lock overlay ("Finish your session to unlock" + "Go to session" button) until the user hits End session. While it is being written, the overlay shows a spinner. Download and Share stay disabled until it unlocks. Verified locally: blurred before, clear after End session.

### 2026-11-19 (fix: celebrity voice was blocked by the browser)
- Bug: the Magic Hour clip arrives a few seconds after the click, so browsers blocked it as autoplay and the site fell back to the robotic browser voice.
- Fix in `web/components/landing.tsx`: one shared audio player is unlocked (a silent sound) during the Send/mic click, then reused for the real voice clip. Verified with real clicks: the Trump clip plays and the browser voice no longer kicks in.

### 2026-11-19 (only 3 therapists: Trump, Snoop Dogg, Amitabh Bachchan)
- Persona lineup cut to 3 at the team's request: Donald Trump, Snoop Dogg (new, "Chief Chill Officer") and Amitabh Bachchan (new, "Shahenshah of Sukoon", Hinglish). Modi was asked for but Magic Hour has no Modi voice, so Amitabh Bachchan was chosen instead.
- All three speak replies in their Magic Hour voices. New parody avatars, colours and sample prescriptions added; old 5 personas and avatars removed. `personas.json` (root + web/data) updated.

### 2026-11-19 (Magic Hour celebrity voices on replies)
- New server route `web/app/api/voice/route.ts`: when a therapist reply arrives, it asks the Magic Hour AI voice generator for audio in that persona's voice (Donald Trump, Gordon Ramsay and Kanye West use Magic Hour's named voices; Dwight, Sherlock and Miranda use stock voices cv-0309, cv-0347 and cv-0472), waits for it (about 3–4 s), and returns the clip URL.
- `web/components/landing.tsx`: replies now play this generated voice; if it fails or credits run out, the browser voice takes over. Audio is cached per reply, and skip, new persona and end session all stop it. Merged with the teammates' 3D therapist and audio-clip work.
- Key `MAGIC_HOUR_API_KEY` kept in `web/.env.local` (gitignored) and in Vercel env (Production + Preview). It is never committed.
- Cost: 0.1 credit per character, so about 9–30 credits per reply. The account is on the free tier (367 credits left after testing, roughly 12–20 more replies).

### 2026-11-19 (feat: 3D interactive therapist character with mouse tracking)
- Implemented real-time interactive 3D Therapist component in `web/components/ui/therapist-3d.tsx` using Three.js:
  - Stylized 3D Doctor/Therapist character seated in an executive leather armchair, complete with doctor's coat, shirt, tie, stethoscope, spectacles/glasses, and sculpted hair.
  - Interactive cursor tracking: 3D head and eyeballs dynamically track the user's mouse position with smooth damped lerp physics.
  - Lifelike idle breathing animation and speech nodding cadence when answering.
  - Reactive studio lighting: key, fill, and rim-light matched to the active persona's accent color.
- Added 3D stage switcher in `web/components/landing.tsx` allowing instant live toggle between the 3D Doctor character and the 3D Robot.
- Verified production build and restarted server on port 3100.

### 2026-11-19 (fix client exception boundary & state safety)
- Added dedicated `web/app/error.tsx` client error boundary to prevent unhandled React exceptions from blanking the screen and provide instant one-click reload.
- Hardened persona & color resolution in `web/components/landing.tsx` with fallback guards against transient undefined states.
- Rebuilt production bundle (`next build`) and restarted server on port 3100.

### 2026-11-19 (rollback 3D therapist stage; restore Spline 3D robot)
- Rolled back commit `c48e1f5` per user direction. Restored the original interactive Spline 3D robot scene (`https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`) on The Couch.
- Preserved celebrity audio clips, safety guards, and neural voice upgrades.
- Rebuilt and restarted production server on port 3100.

### 2026-11-19 (client-side safety hardening & audio schema alignment)
- Fixed potential client-side hydration exception in `web/components/landing.tsx`: added defensive type and null guards for speech synthesis voice detection (`typeof v.lang === "string"`, `typeof v.name === "string"`) and safe array checking (`Array.isArray(persona?.audio_clips)`).
- Aligned `personas.json` and `web/data/personas.json` schema across all 6 personas so `audio_clips` is consistently initialized.
- Built clean production bundle and restarted local server on port 3100.

### 2026-11-19 (authentic celebrity voice bites & neural TTS upgrade)
- Solved robotic speech issue: Windows default browser TTS fell back to monotonic 1995 SAPI "Microsoft David", breaking the celebrity illusion.
- Added verified celebrity audio bites to `web/public/audio/`: Donald Trump (*"It's all fake news, folks!"* and *"Thank you very much"*), Dwight Schrute (*"Idiot. Whenever I'm about to do something..."* and staccato intro), and Gordon Ramsay (*"Where's the lamb sauce?!"* and dramatic kitchen sting).
- Upgraded `personas.json` and `web/data/personas.json` with `audio_clips` metadata.
- Upgraded `speak()` in `web/components/landing.tsx`: prioritizes modern Natural/Neural/Google voices over legacy desktop voices.
- Added "Actual Voice" soundboard chips on The Couch below the VoiceChat widget, allowing judges to trigger real celebrity voice clips with 0ms latency.
- Verified: `next build` passes with zero errors.

### 2026-11-19 (GitHub + Vercel launch)
- Created private GitHub repo **rahul002xxfsh/emergent-hack** with the whole project (website in `web/`, one-pager, personas, log, README). Excluded node_modules, build output, env files and local tool folders; scanned for secrets before pushing.
- Created Vercel project **emergent-hack** (Hobby account), connected to the GitHub repo, root directory `web`, framework Next.js. Every push to `main` now redeploys production automatically.
- Live at **https://emergent-hack.vercel.app** (public). Deployment-specific URLs stay behind Vercel's default login protection.
- Verified live: page loads, chat API replies in character, crisis rule returns the helpline, prescription API works, avatars load, no console errors. Still demo mode (no API key on Vercel).

### 2026-11-19 (final audit: buttons, smoothness, speed)
- Bugs fixed: left/right arrow keys while typing in the chat switched persona and wiped the conversation (now ignored in text fields and when the picker is off screen); chat input lost focus after every send (now stays focused, double-send blocked instead); invisible hero button was clickable before it faded in; Share/Download could fail silently (now show a status line, handle a closed share sheet, fall back to clipboard); End session disabled while a reply is loading; Send disabled over 250 words; first spoken reply now uses the right accent (voices pre-loaded).
- Speed: the 3D robot now pauses when off screen or the tab is hidden (was rendering every frame forever); hero carousel and voice-widget ambient animations pause off screen; persona quote reveal uses opacity/slide instead of per-word blur; lighter nav blur; persona list and 3D scene memoised; nav jumps re-target every frame so late layout shifts can't make them miss.
- Measured: nav jumps went from ~40 fps to a steady 60 fps (16.7 ms/frame) with the 3D scene loaded; wheel scrolling over the robot scrolls the page normally.
- Tested: 18/18 automated checks (hero button, arrows, card click, categories, start session, arrow keys while typing, 250-word block, chat reply, focus kept, off-topic deflection, stress meter, end session, download, try another therapist, all 4 nav tabs) on desktop; 21/21 nav jumps exact on a 375 px phone; no horizontal scroll; no console errors.

### 2026-11-19 (smoother nav jumps)
- Added `web/lib/scroll.ts`: eased smooth scroll (ease-in-out cubic, 450-950 ms depending on distance, lands 96 px below the nav, cancels instantly if the user scrolls or presses a key). Every in-page jump (nav, Start venting, Start session, Try another therapist) uses it; native CSS smooth scroll turned off so the two don't fight.
- Nav highlight is locked to the clicked tab while the page scrolls, so it no longer flickers through the sections in between.
- AnimeNavBar polish: one shared spring for pill + mascot, hover preview pill that glides between tabs, mascot does a small hop on each click, keyboard focus ring, and a thin scroll-progress line in the persona's colour.
- Tested: Home > Prescription, Prescription > Home, Home > Session, Session > Therapists each made exactly one highlight change and landed exactly at the section heading.

### 2026-11-19 (AnimeNavBar + layout)
- Added `web/components/ui/anime-navbar.tsx` (AnimeNavBar): floating centred pill nav with a sliding active pill and a blinking mascot that hops to the active tab, tinted with the selected persona's colour. Items: Home, Therapists, Session, Prescription. Icons only on phones, labels from 640px up. Scroll-spy keeps the active tab in sync with the section on screen; clicks smooth-scroll.
- Removed the old nav (logo, centre links, Start venting button). Added a "Start venting" button to the hero instead.
- Layout: persona column is now name > quote > arrows > divider > categories > Start session; sections offset for the fixed nav; hero title no longer blocks clicks once it fades.
- Verified on 1280px desktop and 375px phone: nav click scrolls to the section, mascot moves, no horizontal scroll.

### 2026-11-19 (website polish + performance)
- Removed the "The problem" text-scroll section (Skiper31) and deleted its component.
- Performance: voice widget particles, glow, pulse rings, waveform and volume bar moved from per-frame React state to CSS transform/opacity animations (no re-renders while idle); timer ticks once per second; hero waveform bars are CSS; the Spline 3D scene loads only when scrolled near and fades in; persona card transitions shortened to 0.5s ease-out (was 0.8s bouncy), quote word reveal faster; lucide/framer imports optimised; Next dev badge hidden; reduced-motion respected.
- Layout: phone persona cards now fit inside the screen; chat input gets full width with End session on its own row on phones; hero badge stays on one line; stress bar starts empty.
- Now served as a production build (`npm run build && npm start`, port 3100). Verified: build passes, chat API works, desktop + 375px phone layouts, no console errors.

### 2026-11-19 (decision)
- Team chose to keep the website prototype in demo mode (no API key); replies come from the built-in demo engine.

### 2026-11-19 (website prototype)
- Built `web/` (Next.js 15 + Tailwind 4 + framer-motion) with the components the team chose: scroll-locked hero (MetroHero), text scroll reveal (Skiper31), persona picker (CircularTestimonials, illustrated SVG avatars, no real photos), session card (SplineScene robot + Spotlight + VoiceChat), and a Session Prescription card with Download (PNG) and Share.
- Requirements covered: text + voice chat (browser speech-to-text and text-to-speech with per-persona pitch/rate); therapy-only scope (system prompt rules + off-topic deflection); edge cases (crisis to Tele-MANAS 14416/112, empty, gibberish, over 250 words, 12-turn limit, jailbreak/prompt reveal, medical advice, hate, real-person topics); 250-word input cap (live counter) and reply cap; prescription written from the whole conversation; keyword stress meter (0-100); 5 categories: Heartbreak, Career, Exams & Projects, Family & Friends, Burnout & Procrastination.
- AI: `/api/chat` and `/api/prescription` call Claude (default claude-opus-5-5, effort low, server-side refusal fallback on chat) when `ANTHROPIC_API_KEY` is set in `web/.env.local`; otherwise built-in demo replies. Tested: all 6 edge cases, chat flow, prescription, mobile layout (375px, no horizontal scroll), no console errors.
- Note: this session's working folder is the empty `/Users/rahul/Downloads/emergent hack.` (with a dot); all project files live in `/Users/rahul/Downloads/emergent hack`.

### 2026-11-18 (night, team's version)
- Team sent their edited form ("Group3Copy of SSB x 1811 Labs - Vibe Coding Hackathon.pdf"). Rebuilt `ONE_PAGER_FORM.html` → `ONE_PAGER.pdf` and `ONE_PAGER.docx` from it, keeping all their content and decisions: team **BakBak Bots** (Chirag 26020, Hridhya 26037, Khanjan 26042, Madhur Rai 26047, Rahul De 26065, Aarti 26004), users 18–30, optional login, prescription card as optional in the flow, their UI and good-to-have wording.
- Light refinements only: restored the "Team Name" label (the team's copy had the team name in the label cell), cleaned grammar and punctuation, numbered the 3 UI screens, made "e.g. Gordon" generic, tidied the good-to-have list, and added "(optional login is a good-to-have)" to the login answer to match the flow.
- Synced team name, members, 18–30 and the login answer into `ONE_PAGER.md`.

### 2026-11-18 (night, UI answer)
- Rewrote the UI answer (Inspiration / Style / 3 named screens / Always-on parody label) in `ONE_PAGER.md`, `ONE_PAGER_FORM.html`, and regenerated `ONE_PAGER.pdf` and `ONE_PAGER.docx`.

### 2026-11-18 (night, Word file)
- Created `ONE_PAGER.docx`: the filled 1811 Labs form as an editable Word document, same content and layout as `ONE_PAGER.pdf`.

### 2026-11-18 (night, one-pager filled)
- Filled every field of `ONE_PAGER.md` for the Celebrity Persona Therapist (team names/numbers still blank).
- Filled the original 1811 Labs form in its exact layout (same table, yellow answer cells, rows 1–7 and 9) as `ONE_PAGER_FORM.html` → `ONE_PAGER.pdf` (2 pages). This replaces the earlier markdown-export PDF.

### 2026-11-18 (evening, personas)
- Idea being explored: **Celebrity Persona Therapist** (voice web app, parody advice + "Session Prescription" card).
- Created `personas.json`: 6 personas (Dwight Schrute, Donald Trump, Gordon Ramsay, Sherlock Holmes, Miranda Priestly, Kanye West) with id, title, style tag, greeting, system prompt, 5 catchphrases, Web Speech voice config and a sample prescription. Every system prompt includes a parody framing, a no-AI-break rule, limits on real-person topics and a crisis safety rule (Tele-MANAS 14416). Validated as JSON.

### 2026-11-18 (evening, removal)
- Removed the Submission checklist from `ONE_PAGER.md` (on request) and regenerated `ONE_PAGER.pdf`.

### 2026-11-18 (evening, later)
- Exported `ONE_PAGER.md` to `ONE_PAGER.pdf` (5 pages, A4) with headless Chrome.

### 2026-11-18 (evening)
- Created `ONE_PAGER.md`. It follows the 1811 Labs form section by section (Team Details, Idea, Idea Breakdown, Engineering, Questions). Every qwen.md field is placed inside one of those sections, with no tables and no new sections. Handbook checklist items (social posts, Video Agent) were added to the submission checklist.

### 2026-11-18
- Read the full Participant Handbook and confirmed the rules, schedule, scoring and podium conditions.
- Created `HACKATHON_LOG.md` (this file) and `CLAUDE.md`.
