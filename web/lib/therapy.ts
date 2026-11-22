import personasJson from "@/data/personas.json";

export type Persona = (typeof personasJson)[number];
export const personas: Persona[] = personasJson;

export const MAX_INPUT_WORDS = 250;
export const MAX_REPLY_WORDS = 250;
export const MAX_USER_TURNS = 12;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const categories = [
  { id: "heartbreak", label: "Heartbreak", hint: "Breakups, crushes, situationships, being left on read" },
  { id: "career", label: "Career", hint: "Jobs, internships, placements, bosses, interviews" },
  { id: "exams", label: "Exams & Projects", hint: "Exams, deadlines, group projects, assignments" },
  { id: "family", label: "Family & Friends", hint: "Parents' expectations, fights, feeling left out" },
  { id: "burnout", label: "Burnout & Procrastination", hint: "No energy, doom-scrolling, lost motivation" },
] as const;
export type CategoryId = (typeof categories)[number]["id"];

export const personaColors: Record<string, { accent: string; soft: string; text: string }> = {
  "snoop-dogg": { accent: "#22C55E", soft: "rgba(34,197,94,0.15)", text: "#86EFAC" },
  "amitabh-bachchan": { accent: "#F97316", soft: "rgba(249,115,22,0.15)", text: "#FDBA74" },
  "narendra-modi": { accent: "#EAB308", soft: "rgba(234,179,8,0.15)", text: "#FDE047" },
  "donald-trump": { accent: "#3B82F6", soft: "rgba(59,130,246,0.15)", text: "#93C5FD" },
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function clampWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text.trim() : words.slice(0, max).join(" ") + "…";
}

// ---------- Stress meter (keyword based, runs in the browser, costs no tokens) ----------
const stressLexicon: Record<string, number> = {
  stress: 3, stressed: 3, anxious: 3, anxiety: 3, panic: 4, overwhelmed: 4, exhausted: 3,
  tired: 2, burnout: 4, "burnt out": 4, deadline: 2, deadlines: 2, exam: 2, exams: 2,
  fail: 3, failed: 3, failing: 3, scared: 3, afraid: 3, worried: 2, worry: 2, cry: 3, crying: 3,
  lonely: 3, alone: 2, heartbroken: 4, breakup: 3, dumped: 3, ghosted: 2, hate: 2, angry: 2,
  frustrated: 2, pressure: 3, cant: 1, "can't": 1, hopeless: 4, useless: 3, stuck: 2,
  procrastinating: 2, procrastination: 2, sleep: 1, insomnia: 3, fired: 3, rejected: 3,
  rejection: 3, toxic: 2, boss: 1, placement: 2, placements: 2, interview: 1, behind: 2,
  "no time": 2, ugh: 1, help: 1, sad: 2, depressed: 4, worthless: 4,
};

export function stressScore(userTexts: string[]): number {
  const text = " " + userTexts.join(" ").toLowerCase().replace(/[^a-z' ]/g, " ") + " ";
  let score = 0;
  for (const [word, weight] of Object.entries(stressLexicon)) {
    const matches = text.split(` ${word} `).length - 1;
    score += matches * weight;
  }
  const exclamations = userTexts.join(" ").split("!").length - 1;
  score += Math.min(exclamations, 5);
  return Math.max(0, Math.min(100, Math.round(score * 6)));
}

export function stressLabel(score: number): string {
  if (score < 20) return "Chill";
  if (score < 45) return "Simmering";
  if (score < 70) return "Boiling";
  return "Full meltdown";
}

// ---------- Edge cases handled before any AI call ----------
const crisisPatterns = [
  /kill (myself|me)/, /suicid/, /\bend(ing)? (my life|it all|myself|everything)/, /\bend my\b/, /want to die/, /don'?t want to (live|be alive)/,
  /better off (if i (was|were) )?dead/, /disappear (forever|for good|permanently)/, /\b(took|taken|take|swallowed|swallow|ate) (too many|a lot of|all (my|the|of my)|a bottle of|an overdose)\b/, /overdos/, /\b(want|wish) (it|everything|this|all of this|all this|the pain|my life) to (stop|end)\b/, /\b(stop|end)\b.{0,12}\b(permanently|forever|for good)\b/, /\bplan to (kill|end|hurt)\b/, /jump(ing)? (off|from) (the|a|this|my) (building|bridge|roof|terrace|balcony|cliff)/, /\bhang(ing)? myself/, /not (want to )?(be|being) (here|alive) anymore/, /can'?t (go on|do this anymore|take it anymore)/, /(khud ?khushi|marna chahta|marna chahti|mar jaunga|mar jaungi|jeena nahi)/, /wish i (was|were) (dead|never born)/, /no point (in )?living/,
  /self[- ]?harm/, /hurt(ing)? myself/, /cut(ting)? myself/, /no reason to live/, /better off dead/,
  /being (abused|hit|beaten|molested|touched)/, /someone is hurting me/, /\b(is|are|keeps?) (hurting|hitting|beating|abusing|touching) me\b/, /\b(hurts|hits|beats|abuses) me\b/,
];

export function isCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return crisisPatterns.some((p) => p.test(t));
}

export const CRISIS_REPLY =
  "I'm stepping out of character for a moment, because this matters more than a joke. I'm a parody bot, not a therapist, and what you're describing deserves real support right now. Please reach out to someone you trust, or call Tele-MANAS on 14416 (free, 24x7, India). If you are in immediate danger, call 112. You don't have to handle this alone.";

export type Precheck = { ok: true } | { ok: false; reply: string; code: string };

export function precheck(text: string, userTurns: number): Precheck {
  const t = text.trim();
  if (!t) return { ok: false, code: "empty", reply: "The couch is listening, but you didn't say anything. Tell me what's stressing you out." };
  // Crisis comes before every other limit: a long or late message about self-harm must still get the helpline.
  if (isCrisis(t)) return { ok: false, code: "crisis", reply: CRISIS_REPLY };
  if (countWords(t) > MAX_INPUT_WORDS)
    return { ok: false, code: "too_long", reply: `That's a whole novel. Keep it under ${MAX_INPUT_WORDS} words so I can actually help.` };
  if (userTurns > MAX_USER_TURNS)
    return { ok: false, code: "turn_limit", reply: "We've covered a lot. Time to end the session and collect your prescription." };
  if (!/[a-zऀ-ॿ]{2,}/i.test(t))
    return { ok: false, code: "gibberish", reply: "I couldn't make sense of that. Try telling me, in a sentence, what's bothering you." };
  return { ok: true };
}

import { respond } from "@/lib/responder";

// ---------- Offline demo engine (used when no API key is configured) ----------
export function offlineReply(persona: Persona, categoryId: CategoryId, userText: string, turn: number, history: string[] = []): string {
  const usable = persona.catchphrases.filter((c) => !c.includes("..."));
  const topicHint: Record<CategoryId, string> = { heartbreak: "heartbreak", career: "job", exams: "exam", family: "parents", burnout: "tired" };
  const hinted = [...history, topicHint[categoryId]];
  return respond(persona.id, userText, hinted, turn, usable);
}

export function offlinePrescription(persona: Persona, categoryId: CategoryId) {
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  return {
    diagnosis: `${persona.sample_prescription.diagnosis} (${category.label} edition)`,
    three_step_rx: persona.sample_prescription.three_step_rx,
    signoff: persona.sample_prescription.signoff,
  };
}
