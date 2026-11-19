"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles, Volume2, Award, Bot, User } from "lucide-react";
import { SplineScene } from "./splite";
import type { Persona } from "@/lib/therapy";

interface TherapistStageProps {
  persona: Persona;
  status: "idle" | "listening" | "processing" | "speaking";
  lastReply?: string;
  color: { accent: string; soft: string; text: string };
  onTriggerVoice?: () => void;
}

const CREDENTIALS: Record<string, { degree: string; board: string; seal: string }> = {
  "dwight-schrute": {
    degree: "Assistant to the Regional Therapist, Sc.D.",
    board: "Schrute Farms Board of Agrarian Psychiatry",
    seal: "🚜 BEET CERTIFIED",
  },
  "donald-trump": {
    degree: "Chief Executive of Mental Deals & Feelings",
    board: "Trump Tower Institute of Tremendous Wellness",
    seal: "🏛️ 100% BIG LEAGUE",
  },
  "gordon-ramsay": {
    degree: "Head Chef of Emotional Mise en Place, O.B.E.",
    board: "Hell's Clinic of Culinary Discipline",
    seal: "🍳 3 MICHELIN STARS",
  },
  "sherlock-holmes": {
    degree: "Consulting Detective of the Subconscious",
    board: "221B Baker Street Society of Deductions",
    seal: "🔍 ELEMENTARY",
  },
  "miranda-priestly": {
    degree: "Editor-in-Chief of Emotional Wardrobes",
    board: "Runway Council of Posture & Taste",
    seal: "👠 COUTURE GRADE",
  },
  "kanye-west": {
    degree: "Creative Director of Your Inner Genius",
    board: "Sunday Service Department of Self-Belief",
    seal: "🎧 24 GRAMMYS",
  },
};

export function TherapistStage({
  persona,
  status,
  lastReply,
  color,
  onTriggerVoice,
}: TherapistStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"persona" | "robot">("persona");

  // 3D Mouse Parallax Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isSpeaking = status === "speaking";
  const isListening = status === "listening";
  const isProcessing = status === "processing";

  const credential = CREDENTIALS[persona.id] ?? {
    degree: "Parody Specialist in Rapid Stress Relief",
    board: "International Academy of Unaccredited Advice",
    seal: "🧠 SATIRICAL RX",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e0e14] via-[#09090d] to-[#050508] p-4 flex flex-col justify-between select-none"
      style={{ perspective: 1000 }}
    >
      {/* Top Bar: View Mode Switcher + Live Status */}
      <div className="relative z-20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: isSpeaking ? color.accent : "#10B981" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: isSpeaking ? color.accent : "#10B981" }}
            />
          </span>
          <span className="font-mono text-[11px] text-neutral-400">
            {isSpeaking
              ? "Speaking Diagnosis"
              : isProcessing
              ? "Analyzing Neuroses..."
              : isListening
              ? "Listening to Patient..."
              : "On Call in Chair"}
          </span>
        </div>

        {/* Toggle between Celebrity Persona & 3D Robot */}
        <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode("persona")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition ${
              viewMode === "persona" ? "bg-white/15 text-white font-semibold" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <User className="h-3 w-3" />
            <span>Therapist</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("robot")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition ${
              viewMode === "robot" ? "bg-white/15 text-white font-semibold" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Bot className="h-3 w-3" />
            <span>3D Robot</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      {viewMode === "robot" ? (
        <div className="relative h-full w-full my-auto">
          <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
        </div>
      ) : (
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative my-auto flex flex-col items-center justify-center py-4"
        >
          {/* Background Ambient Glow & Wall Plaque */}
          <div
            className="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl transition-opacity duration-700"
            style={{
              background: color.accent,
              opacity: isSpeaking ? 0.35 : 0.15,
            }}
          />

          {/* Wall Plaque / Diploma (Depth Layer 1) */}
          <motion.div
            style={{ transform: "translateZ(20px)" }}
            className="mb-3 max-w-[280px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-center backdrop-blur-sm"
          >
            <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-widest text-amber-300/80 font-mono">
              <Award className="h-3 w-3" />
              <span>{credential.seal}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-semibold text-neutral-300">{credential.degree}</p>
            <p className="text-[8px] text-neutral-500 font-mono">{credential.board}</p>
          </motion.div>

          {/* Interactive Character Avatar (Depth Layer 2) */}
          <motion.div
            style={{ transform: "translateZ(50px)" }}
            className="relative cursor-pointer group"
            onClick={onTriggerVoice}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            title={`Click to hear ${persona.name}`}
          >
            {/* Pulsing Ripple Rings while speaking */}
            {isSpeaking && (
              <>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: color.accent }}
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1.55, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: color.accent }}
                />
              </>
            )}

            {/* Avatar Frame with Studio Border */}
            <div
              className={`relative h-44 w-44 md:h-52 md:w-52 overflow-hidden rounded-full border-4 shadow-2xl transition-all duration-300 ${
                isSpeaking ? "shadow-amber-500/30" : "shadow-black/60"
              }`}
              style={{ borderColor: isSpeaking ? color.accent : "rgba(255,255,255,0.15)" }}
            >
              <Image
                src={`/avatars/${persona.id}.svg`}
                alt={persona.name}
                fill
                priority
                className={`object-cover transition-transform duration-500 ${
                  isSpeaking ? "scale-105" : "group-hover:scale-105"
                }`}
              />

              {/* Click to Hear Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  <Volume2 className="h-3.5 w-3.5" /> Speak
                </span>
              </div>
            </div>

            {/* Speaking Equalizer Badge */}
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md"
                style={{ backgroundColor: color.accent }}
              >
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-white animate-pulse" />
                  <span className="w-0.5 h-2/3 bg-white animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-0.5 h-4/5 bg-white animate-pulse" style={{ animationDelay: "0.4s" }} />
                </span>
                <span>Active</span>
              </motion.div>
            )}
          </motion.div>

          {/* Name & Title Under Stage */}
          <motion.div style={{ transform: "translateZ(30px)" }} className="mt-3 text-center">
            <h3 className="font-bold text-base md:text-lg text-white tracking-tight">{persona.name}</h3>
            <p className="text-xs font-mono" style={{ color: color.text }}>
              {persona.therapy_style_tag}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Diagnosis / Speech Bubble (Depth Layer 3) */}
      <AnimatePresence mode="wait">
        {lastReply && (
          <motion.div
            key={lastReply}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative z-20 mt-2 rounded-2xl border border-white/10 bg-black/75 p-3.5 text-xs backdrop-blur-md shadow-xl"
            style={{ borderLeftColor: color.accent, borderLeftWidth: 3 }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
              <span className="flex items-center gap-1 font-semibold" style={{ color: color.text }}>
                <Sparkles className="h-3 w-3" />
                {persona.name} Diagnosis:
              </span>
              <span className="text-neutral-500">Live Transcript</span>
            </div>
            <p className="text-neutral-200 leading-relaxed font-sans line-clamp-3">{lastReply}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
