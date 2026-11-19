"use client";

import { useSyncExternalStore } from "react";

/**
 * Real-time subtitles for whatever the therapist is saying.
 * A tiny external store so only the caption bar re-renders while audio plays.
 */
type State = { text: string; words: string[]; ends: number[]; shown: number; name: string; color: string; visible: boolean };

const EMPTY: State = { text: "", words: [], ends: [], shown: 0, name: "", color: "#fff", visible: false };
let state: State = EMPTY;
const listeners = new Set<() => void>();
const emit = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

let raf = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let hideT: ReturnType<typeof setTimeout> | null = null;
let token = 0;

function clearClock() {
  cancelAnimationFrame(raf);
  if (timer) clearInterval(timer);
  timer = null;
  if (hideT) clearTimeout(hideT);
  hideT = null;
}

/** Number of words spoken once `chars` characters have been voiced. */
function wordsAt(chars: number) {
  let n = 0;
  while (n < state.ends.length && state.ends[n] <= chars) n++;
  return n;
}

function setChars(chars: number) {
  const n = Math.max(state.shown, wordsAt(chars));
  if (n !== state.shown) emit({ shown: n });
}

function begin(text: string, name: string, color: string) {
  clearClock();
  token++;
  const words = text.split(/\s+/).filter(Boolean);
  const ends: number[] = [];
  let acc = 0;
  for (const w of words) {
    acc += w.length + 1;
    ends.push(acc - 1);
  }
  emit({ text, words, ends, shown: 0, name, color, visible: true });
  return token;
}

export const caption = {
  /** Follow an <audio> element: reveal words in step with its playback position. */
  followAudio(text: string, name: string, color: string, audio: HTMLAudioElement) {
    const t = begin(text, name, color);
    const total = text.length;
    const tick = () => {
      if (t !== token) return;
      const d = audio.duration;
      if (d && isFinite(d) && d > 0) setChars(((audio.currentTime + 0.12) / d) * total);
      if (!audio.ended) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  },
  /** Browser voice: start an estimate clock; real word boundaries (if the browser sends them) take over. */
  followSpeech(text: string, name: string, color: string, rate = 1) {
    const t = begin(text, name, color);
    const charsPerSec = 14.5 * rate;
    const start = performance.now();
    timer = setInterval(() => {
      if (t !== token) return;
      setChars(((performance.now() - start) / 1000) * charsPerSec);
    }, 120);
  },
  /** SpeechSynthesis boundary event: exact position. */
  boundary(charIndex: number, charLength = 0) {
    setChars(charIndex + Math.max(charLength, 1));
  },
  /** Speech finished: show the whole line briefly, then hide. */
  finish() {
    clearClock();
    emit({ shown: state.words.length });
    const t = token;
    hideT = setTimeout(() => t === token && emit({ visible: false }), 1600);
  },
  /** Stopped or interrupted: hide right away. */
  stop() {
    clearClock();
    token++;
    if (state.visible) emit({ visible: false });
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const WINDOW = 26; // words kept on screen (about two lines)

export function LiveCaption() {
  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const from = Math.max(0, s.shown - WINDOW);
  const spoken = s.words.slice(from, s.shown);
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-3 bottom-5 z-[9998] flex justify-center transition-all duration-300 md:bottom-8 ${
        s.visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="max-w-3xl rounded-2xl border border-white/10 bg-black/80 px-5 py-3 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md md:px-7 md:py-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: s.color }}>
          {s.name} · live caption
        </p>
        <p className="min-h-[1.5em] text-base leading-relaxed text-white md:text-xl">
          {from > 0 && <span className="text-white/50">… </span>}
          {spoken.map((w, i) => (
            <span key={from + i} className={i === spoken.length - 1 ? "font-semibold" : undefined} style={i === spoken.length - 1 ? { color: s.color } : undefined}>
              {w}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
