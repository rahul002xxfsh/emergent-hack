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

### 2026-11-19 (Emergent brief: GPT instead of Claude)
- Not enough Claude credits, so `EMERGENT_BUILD_BRIEF.md` now asks Emergent to use the Universal Key with a GPT "mini" model for chat replies and the prescription (JSON mode), with Gemini Flash as the backup and Claude explicitly excluded. Safety (crisis + off-topic rules) still runs before the AI, so it doesn't depend on the model. `EMERGENT_UPLOAD.zip` rebuilt.

### 2026-11-19 (Emergent transfer pack)
- New `EMERGENT_BUILD_BRIEF.md`: Part A (Plan Mode opening prompt), Part B (full spec: layout, 4 personas, therapy-style AI replies via Emergent's Universal Key and Claude, exact order of safety checks, crisis and off-topic replies, prescription, stress meter, Fish voices with IDs and autoplay fix, voice-chat-only live captions, security, performance), Part C (files to attach, secret to add, photo credits) and Part D (10-point acceptance checklist, including the 198-case boundary dataset).
- AI replies now follow a 5-part therapy pattern (acknowledge, normalise, reframe, one small step, one question; 60–120 words) to fix "random" replies.
- `EMERGENT_UPLOAD.zip` (local only, gitignored): brief + personas + dataset + rule files + photos + couch image + Trump clips + 3D model, ready to upload.
- Decision: the Emergent build uses the Universal Key (Emergent credits), not a personal Anthropic key.

### 2026-11-19 (demo replies now answer the actual question)
- Problem: with no AI key, the demo engine repeated the same few scripted lines whatever the user asked.
- New `web/lib/responder.ts` (no API, no cost): detects the topic (sleep, tiredness, breakup, crush/ghosting, loneliness, friends, family, exams, projects, boss, career, procrastination, anxiety, confidence, future, anger, sadness; falls back to the chosen category) and the kind of message (why / how / should I / what if / is it normal / venting). It reflects the user's own words back ("you're asking why you always feel tired after work") and answers with topic-specific explanations, practical steps and a follow-up question in each persona's voice (Trump, Snoop, Amitabh, Modi). Variants rotate so repeated messages don't get identical replies.
- Team decision: do NOT add an Anthropic / Claude API key or use AI Gateway on the website; the site stays on this built-in engine.
- Boundary eval still 198/198.

### 2026-11-19 (therapy-only boundary + edge-case dataset; captions only in voice chat)
- Live captions now show only for voice chat replies (removed from the "Now on the couch" greeting).
- New `web/lib/boundary.ts`: a rule filter that runs before the AI (and in demo mode). Off-topic requests and jailbreak attempts get exactly "This is not something we are here to discuss. Is there anything that I can help you with related to your therapy?". Covers politics/elections, news, celebrity gossip, movies/music trivia, coding, maths, homework/essay writing, general knowledge, shopping, recipes, medical/medication and legal advice, and "ignore your instructions" tricks. Venting that mentions these topics (e.g. "my code keeps failing and my boss is angry", "office politics is killing me") still gets a therapy reply.
- AI prompt: the team's STRICT DOMAIN BOUNDARY text added verbatim (with the crisis exception) plus worked examples; the reply is forced to the exact sentence if the model uses it.
- Crisis detection broadened (ending it all, better off dead, overdose, jumping off a building, "want everything to stop", someone hurting/beating me, Hindi phrases). Crisis always wins over the off-topic rule.
- New dataset `web/data/boundary-dataset.json` (198 labelled cases) and test runner `web/scripts/eval-boundary.mjs`. Result 198/198. Honest generalisation check: a fresh unseen batch scored 27/30 before fixes, so expect about 90% on brand-new phrasings.

### 2026-11-19 (real-time captions while a therapist speaks)
- New `web/components/ui/live-caption.tsx`: a subtitle bar fixed at the bottom of the screen that shows the therapist's words as they are spoken (newest word highlighted in the persona colour, about 2 lines visible, fades out 1.6 s after speech ends).
- Sync: Fish audio follows the clip's playback position (`currentTime / duration`, word by word); the browser-voice fallback uses the browser's word-boundary events, with a timing estimate if those aren't sent. A tiny external store means only the caption bar re-renders during playback.
- Hooked into session replies and the "Now on the couch" greeting mic; stops instantly on skip, persona change or a new reply. The static caption in the 3D stage is renamed "Last reply".
- Tested: an 18-word greeting reveals ~3 words at 0.6 s and all 18 at 4.9 s (clip length); a 12.8 s reply advances live; works on phone width with no sideways scroll.

### 2026-11-19 (security audit)
- Full audit against the team checklist; results in `SECURITY_AUDIT.md`.
- New `web/lib/guard.ts`: zod input validation and per-visitor rate limits on `/api/chat` (20/min), `/api/voice` (15/min) and `/api/prescription` (8/min). Errors no longer expose internal details.
- `web/next.config.ts`: HSTS, clickjacking protection, nosniff, referrer and permissions policies; `X-Powered-By` off; no browser source maps.
- Removed unused files (default icons, old voice clips) and the `console.log` demo component. `npm audit`: 0 vulnerabilities (PostCSS pinned via overrides; React 19.3.1, Spline runtime 2.0.198).
- Verified: no secrets in files, git history or browser bundles; full click-through works with no console errors.

### 2026-11-19 (less empty space, brighter hero)
- Hero is no longer forced to full screen height: it sizes to its content with top padding for the menu, so the title no longer sits under the nav pill and the big empty gap is gone.
- Hero couch photo visibility raised from 25% to 40% opacity (dark overlay slightly lighter too).
- Tighter section spacing: therapist section top padding, Session and Prescription sections (the prescription section no longer forces a full-screen height). All 4 menu jumps re-checked and land exactly.

### 2026-11-19 (couch + picker side by side, tap-to-hear greetings)
- `web/components/ui/scroll-locked-video-hero.tsx`: the 260vh scroll-zoom hero is replaced by a simple full-screen intro (title + "Start venting" over the couch photo). The "Now on the couch" reel is now a `CouchPanel` component.
- `web/components/landing.tsx`: "Now on the couch" (left) and "Pick your therapist" (right) now sit side by side in one section on laptop screens; the left panel stays in view while scrolling. On phones they stack. The couch panel follows whichever therapist is selected.
- Tapping the couch panel mic plays that therapist's greeting in their Fish voice (loading spinner → "X is speaking…" with moving bars; tap again to stop). Falls back to the browser voice. Greetings are cached per page load.
- `circular-testimonials.tsx`: new `stacked` option so the picker fits a half-width column.

### 2026-11-19 (Fish-only voices + real photos)
- Removed the Magic Hour and AnyToSpeech keys from `web/.env.local` and from Vercel (Production + Preview), and their code. `web/app/api/voice/route.ts` is now Fish Audio only (model `s2.1-pro-free`); if Fish fails, the browser voice is used. `.env.example` and README updated. Only `FISH_API_KEY` remains.
- Images: the cartoon SVG avatars are replaced with freely licensed photos from Wikimedia Commons in `web/public/personas/` (Trump: public domain; Snoop Dogg: CC BY 2.0; Amitabh Bachchan: CC BY-SA 4.0; Modi: GODL-India). They are used in the hero reel, therapist picker, session header and the Session Prescription card. A public-domain photo of Freud's therapy couch (`web/public/images/therapy-couch.jpg`) is the hero backdrop.
- Footer now credits every photo with author, licence and a link, and says no endorsement is implied.

### 2026-11-19 (copy cleanup to match the 4-therapist theme)
- Website: replaced the developer-only "no AI key set" note with a friendly demo-mode line; the page description now names the 4 therapists; small comment fix in `voice-chat.tsx`.
- `web/.env.example`: lists every optional key (Claude, Fish Audio, AnyToSpeech, Magic Hour) and the voice fallback order.
- `README.md`: rewritten for 4 therapists (table with titles and styles), the voice setup, and the locked prescription.
- One-pager (`ONE_PAGER.md`, `ONE_PAGER_FORM.html` → `ONE_PAGER.pdf`, `ONE_PAGER.docx`): persona names changed from the old 6 to Trump, Snoop Dogg, Amitabh Bachchan and Narendra Modi in the solution, UI, demo script, testing and open-question lines. Meaning is otherwise unchanged; the PDF is still 2 pages.

### 2026-11-19 (Narendra Modi added as a 4th therapist)
- New persona "Narendra Modi", the "Pradhan Mantri of Peace of Mind" (Hinglish, mann-ki-baat style pep talks, yoga and sankalp jokes). It has strict no-politics limits and the same crisis rule. Added to `personas.json` (root + web/data), with a parody avatar `web/public/avatars/narendra-modi.svg` and a saffron accent colour.
- Voice: Fish Audio library voice 03e67975… If Fish fails, it falls back to the browser voice (Magic Hour and AnyToSpeech have no Modi voice).
- Fixed the voice route so a persona without a Magic Hour backup is no longer rejected. Copy changed to "Four parody personas".

### 2026-11-19 (Fish Audio as the main voice)
- `web/app/api/voice/route.ts`: all three therapists now speak with Fish Audio library voices (REST `POST /v1/tts`, free model `s2.1-pro-free`, MP3 returned to the browser as a data URL, about 1–2 s). Voice IDs: Trump 010da99c…, Snoop Dogg 36383de9…, Amitabh Bachchan ea7cdc74… (most-used Fish library voices). Done the Next.js way instead of the Python SDK from the plan; same API.
- Fallback order: Fish → AnyToSpeech (Trump only) → Magic Hour → browser voice.
- Not done: the plan's Path B (cloning from a short clip of the real person). We only use voices that already exist in the provider's library.
- Key `FISH_API_KEY` is in `web/.env.local` (gitignored) and Vercel env (Production + Preview).

### 2026-11-19 (feat: integrate Sketchfab Therapist 3D model with neck pivot tracking)
- Integrated user-uploaded `Therapist.glb` 3D model from Sketchfab into `web/public/models/therapist.glb` (6.14 MB).
- Upgraded `web/components/ui/therapist-3d.tsx` to automatically load the GLB model, frame the therapist bust portrait, and bind the model's `head` node to a custom neck pivot joint (`neck_pivot`).
- Interactive mouse tracking now rotates the therapist's actual head smoothly on its neck with damped lerp physics, subtle breathing motion, and speech nodding.
- Rebuilt production bundle and refreshed local server on port 3100.

### 2026-11-19 (AnyToSpeech for the Trump voice)
- `web/app/api/voice/route.ts`: Trump replies now use AnyToSpeech (MCP over HTTP, `speech_synthesize` with `famous_slug: donald-trump`). It is synchronous and returns an MP3 in about 2 s, versus about 4 s on Magic Hour. If AnyToSpeech fails, Magic Hour is the backup, then the browser voice.
- AnyToSpeech has no Snoop Dogg or Amitabh Bachchan voice, so those two stay on Magic Hour.
- Key `ANYTOSPEECH_API_KEY` is in `web/.env.local` (gitignored) and Vercel env (Production + Preview). Free plan: 5,000 characters of credit.

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
