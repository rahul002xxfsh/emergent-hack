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

## Therapy-only boundary
The chatbot only talks about the user's own stress, feelings and everyday struggles. Anything else gets one fixed reply:
> "This is not something we are here to discuss. Is there anything that I can help you with related to your therapy?"

It works in three layers:
1. **Rules before any AI call** (`web/lib/boundary.ts`): catch jailbreak attempts, politics, news, gossip, movie and music trivia, coding, maths, homework and writing, general knowledge, shopping, recipes, and medical or legal advice. Crisis messages are checked first and always get the helpline reply (Tele-MANAS 14416, 112).
2. **AI instructions** (`buildSystemPrompt` in `web/lib/therapy.ts`): the strict domain boundary plus worked examples for the subtle cases.
3. **Safety net**: if the AI uses the off-topic sentence, only that sentence is sent.

**Edge-case dataset:** `web/data/boundary-dataset.json` has 198 labelled messages (therapy / off_topic / crisis), including tricky venting such as "my code keeps failing and my manager is angry", Hinglish, and 60 messages added after the rules were written. Run it against a local server:
```bash
cd web && npm run build && npx next start -p 3100
node scripts/eval-boundary.mjs
```
Current result: 198/198. On a fresh batch the rules had never seen, the first score was 27/30, so expect about 90% on brand-new phrasings. Add every miss to the dataset.

## Run locally
```bash
cd web
npm install
npm run dev
```
Every key is optional. Without any keys the app uses scripted demo replies and the browser voice. Copy `web/.env.example` to `web/.env.local` to add Claude (live replies) and the Fish Audio voice key.
