# Celebrity Persona Therapist · BakBak Bots

Vent to a parody celebrity "therapist", hear funny in-character advice out loud, and leave with a shareable **Session Prescription** card.
Built for the SSB x Emergent Vibe Coding Hackathon (Nov 2026).

> Parody and entertainment only. Not real therapy, not affiliated with any celebrity. Struggling for real? Tele-MANAS 14416 (India) or 112.

## What's here
| Path | What it is |
|---|---|
| `web/` | The website (Next.js 15, Tailwind 4, framer-motion, Spline 3D) |
| `personas.json` | The 6 parody personas (prompts, catchphrases, voice settings) |
| `ONE_PAGER.pdf` / `.docx` / `.md` | Hackathon one-pager |
| `HACKATHON_LOG.md` | Running log of every change and decision |

## Features
- 6 parody personas, 5 stress categories (Heartbreak, Career, Exams & Projects, Family & Friends, Burnout & Procrastination)
- Voice (browser speech-to-text + text-to-speech) and text chat
- Therapy-only scope with edge-case handling (crisis → helpline, off-topic, empty, gibberish, 250-word limit, 12-turn limit)
- Keyword stress meter (0-100)
- Session Prescription card with PNG download and share

## Run locally
```bash
cd web
npm install
npm run dev
```
Without an `ANTHROPIC_API_KEY` the app uses built-in demo replies. To enable live AI replies, copy `web/.env.example` to `web/.env.local` and add a key.
