"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, Mic } from "lucide-react";
import { personas, personaColors } from "@/lib/therapy";

type MetroHeroProps = {
  /** Optional video. Without one, an animated "live session" reel plays inside the frame. */
  videoSrc?: string;
  onStart?: () => void;
};

function SessionReel() {
  const [i, setI] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!onScreen) return; // pause the carousel while the hero is off screen
    const t = setInterval(() => setI((v) => (v + 1) % personas.length), 2600);
    return () => clearInterval(t);
  }, [onScreen]);
  const p = personas[i];
  const c = personaColors[p.id];
  return (
    <div ref={boxRef} className={`absolute inset-0 overflow-hidden ${onScreen ? "" : "[&_*]:[animation-play-state:paused]"}`} style={{ background: `radial-gradient(circle at 30% 20%, ${c.soft}, transparent 60%), #07070a` }}>
      {/* Therapy-room backdrop (Freud Museum couch, public domain) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/therapy-couch.jpg" alt="" aria-hidden decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 20%, ${c.soft}, transparent 60%), linear-gradient(to bottom, rgba(7,7,10,0.55), rgba(7,7,10,0.9))` }} />
      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center md:flex-row md:gap-12 md:text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/personas/${p.id}.jpg`} alt={p.name} decoding="async" className="h-40 w-32 rounded-3xl object-cover shadow-2xl md:h-64 md:w-52" style={{ boxShadow: `0 30px 80px -20px ${c.accent}` }} />
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: c.text }}>Now on the couch · {p.title}</p>
            <p className="mt-3 text-2xl font-semibold text-white md:text-4xl">&ldquo;{p.greeting}&rdquo;</p>
            <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: c.accent }}>
                <Mic className="h-4 w-4 text-black" />
              </span>
              <div className="flex h-6 items-end gap-[3px]" aria-hidden>
                {Array.from({ length: 22 }).map((_, k) => (
                  <span
                    key={k}
                    className="reel-bar h-6 w-[3px] rounded-full"
                    style={{ background: c.accent, animationDelay: `${-k * 0.07}s`, animationDuration: `${0.6 + ((k * 7) % 5) * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-400">{p.name} is speaking…</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function MetroHero({ videoSrc, onStart }: MetroHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.5, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.6], [40, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], ["42vh", "0vh"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const titlePointer = useTransform(scrollYProgress, (v) => (v > 0.25 ? "none" : "auto"));
  const ctaOpacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  const ctaPointer = useTransform(scrollYProgress, (v) => (v > 0.7 ? "auto" : "none"));

  return (
    <section id="home" ref={ref} className="relative h-[260vh] bg-[#050505]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ opacity: titleOpacity, y: titleY, pointerEvents: titlePointer }} className="absolute top-[15vh] z-20 px-6 text-center md:top-[16vh]">
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
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Start venting
            </button>
            <span className="text-xs text-neutral-500">or scroll ↓</span>
          </div>
        </motion.div>

        <motion.div
          style={{ scale, borderRadius: radius, y }}
          className="relative h-screen w-screen overflow-hidden border border-white/10 will-change-transform [transform:translateZ(0)]"
        >
          {videoSrc ? (
            <video src={videoSrc} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <SessionReel />
          )}
          <motion.div style={{ opacity: ctaOpacity, pointerEvents: ctaPointer }} className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Pick your therapist
            </button>
            <ArrowDown className="h-5 w-5 animate-bounce text-neutral-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
