# Celebrity Persona Therapist · BakBak Bots

Vent to a parody celebrity "therapist", hear funny in-character advice out loud in their voice, and finish with a shareable **Session Prescription** card.
Built for the SSB x Emergent Vibe Coding Hackathon (Nov 2026). Live: https://emergent-hack.vercel.app

> Parody and entertainment only. Not real therapy, not affiliated with or endorsed by any celebrity. Struggling for real? Tele-MANAS 14416 (India) or 112.

## What's here
| Path | What it is |
|---|---|
| `web/` | The website (Next.js 15, Tailwind 4, framer-motion, 3D therapist + Spline) |
| `personas.json` | The 4 parody personas (prompts, catchphrases, voice settings, sample prescriptions) |
| `ONE_PAGER.pdf` / `.docx` / `.md` | Hackathon one-pager |
| `HACKATHON_LOG.md` | Running log of every change and decision |

## The therapists
| Therapist | Title | Style |
|---|---|---|
| Donald Trump | Chief Executive of Feelings | Tremendous, very huge healing |
| Snoop Dogg | Chief Chill Officer | Laid-back, low-stress flow |
| Amitabh Bachchan | Shahenshah of Sukoon | Baritone wisdom, quiz-show calm (Hinglish) |
| Narendra Modi | Pradhan Mantri of Peace of Mind | Mann ki baat, mann ki shanti (Hinglish) |

All four stay strictly off politics, religion and real-world claims, and drop the act for a helpline message if a user mentions a crisis.

## Features
- Pick a therapist and one of 5 stress topics (Heartbreak, Career, Exams & Projects, Family & Friends, Burnout & Procrastination)
- Talk by voice (mic) or text; replies are spoken out loud in a celebrity-style voice (Fish Audio, free `s2.1-pro-free` model; falls back to the browser voice)
- Therapy-only scope with edge cases handled (crisis → helpline, off-topic, empty, gibberish, 250-word limit, 12-turn limit)
- Live stress meter (0-100) from stress words
- Session Prescription stays blurred until you end the session, then download it as a PNG or share it

## Run locally
```bash
cd web
npm install
npm run dev
```
Every key is optional. Without any keys the app uses scripted demo replies and the browser voice. Copy `web/.env.example` to `web/.env.local` to add Claude (live replies) and the Fish Audio voice key.
