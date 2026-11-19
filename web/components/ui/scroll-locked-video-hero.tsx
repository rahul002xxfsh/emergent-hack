"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Mic, Square, Loader2 } from "lucide-react";
import { personaColors } from "@/lib/therapy";

type Persona = { id: string; name: string; title: string; greeting: string };
type GreetState = "idle" | "loading" | "playing";

/** Intro screen: title + call to action over the therapy-room photo. */
export default function MetroHero({ onStart }: { onStart?: () => void }) {
  return (
    <section id="home" className="relative flex items-center justify-center overflow-hidden bg-[#050505] px-6 pb-20 pt-40 md:pb-24 md:pt-48">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/therapy-couch.jpg" alt="" aria-hidden decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/60 to-[#050505]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <p className="mb-4 inline-block whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-300 md:px-4 md:text-xs md:tracking-[0.3em]">
          BakBak Bots · Parody, not therapy
        </p>
        <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-4xl font-bold leading-[1.05] text-transparent md:text-7xl">
          Vent to a celebrity.
          <br />
          Leave with a prescription.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-400 md:text-lg">
          Pick a parody therapist, rant out loud, hear in-character advice, and walk away with a shareable Session Prescription.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Start venting
          </button>
          <ArrowDown className="h-5 w-5 animate-bounce text-neutral-500" />
        </div>
      </motion.div>
    </section>
  );
}

/** "Now on the couch" panel: the selected therapist's photo and greeting. Tap the mic to hear it. */
export function CouchPanel({ persona, greet, onMic }: { persona: Persona; greet: GreetState; onMic: () => void }) {
  const c = personaColors[persona.id];
  const playing = greet === "playing";
  return (
    <div
      className={`relative h-full min-h-[520px] overflow-hidden rounded-3xl border border-white/10 ${playing ? "" : "[&_.reel-bar]:[animation-play-state:paused]"}`}
      style={{ background: "#07070a" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/therapy-couch.jpg" alt="" aria-hidden decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{ background: `radial-gradient(circle at 30% 25%, ${c.soft}, transparent 60%), linear-gradient(to bottom, rgba(7,7,10,0.5), rgba(7,7,10,0.92))` }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={persona.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full flex-col justify-center gap-6 p-7 md:p-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/personas/${persona.id}.jpg`}
            alt={persona.name}
            decoding="async"
            className="h-44 w-36 rounded-3xl object-cover object-top shadow-2xl md:h-56 md:w-44"
            style={{ boxShadow: `0 30px 80px -20px ${c.accent}` }}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: c.text }}>
              Now on the couch · {persona.title}
            </p>
            <p className="mt-3 text-2xl font-semibold leading-snug text-white md:text-3xl">&ldquo;{persona.greeting}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={onMic}
                aria-label={playing ? `Stop ${persona.name}` : `Hear ${persona.name}'s greeting`}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
                style={{ background: c.accent, boxShadow: playing ? `0 0 0 6px ${c.accent}33, 0 0 28px ${c.accent}` : undefined }}
              >
                {greet === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-black" />
                ) : playing ? (
                  <Square className="h-4 w-4 fill-black text-black" />
                ) : (
                  <Mic className="h-5 w-5 text-black" />
                )}
              </button>
              <div className={`flex h-7 items-end gap-[3px] transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-40"}`} aria-hidden>
                {Array.from({ length: 18 }).map((_, k) => (
                  <span
                    key={k}
                    className="reel-bar h-7 w-[3px] rounded-full"
                    style={{ background: c.accent, animationDelay: `${-k * 0.07}s`, animationDuration: `${0.6 + ((k * 7) % 5) * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-300" aria-live="polite">
                {greet === "loading" ? "Warming up the voice…" : playing ? `${persona.name} is speaking…` : `Tap the mic to hear ${persona.name.split(" ")[0]}`}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
