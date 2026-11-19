"use client";

import { Mic, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type VoiceStatus = "idle" | "listening" | "processing" | "speaking";

interface VoiceChatProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onVolumeChange?: (volume: number) => void;
  className?: string;
  demoMode?: boolean;
  /** Controlled mode: when set, the parent drives the state (real mic + voice). */
  status?: VoiceStatus;
  onToggle?: () => void;
  /** Label under the mic, e.g. "Snoop Dogg · parody therapist". */
  assistantLabel?: string;
}

// Deterministic pseudo-random so server and client render the same particles.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${rand(i, 1) * 100}%`,
  top: `${rand(i, 2) * 100}%`,
  size: 2 + rand(i, 3) * 3,
  delay: `${-rand(i, 4) * 6}s`,
  duration: `${5 + rand(i, 5) * 5}s`,
}));
const BARS = Array.from({ length: 32 }, (_, i) => ({
  delay: `${-rand(i, 6) * 0.9}s`,
  duration: `${0.45 + rand(i, 7) * 0.45}s`,
  peak: 0.35 + rand(i, 8) * 0.65,
}));

/** Ambient particles: pure CSS animation, no React re-renders. */
const Particles = memo(function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="vc-particle absolute rounded-full bg-primary/25"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}
    </div>
  );
});

export function VoiceChat({
  onStart,
  onStop,
  onVolumeChange,
  className,
  demoMode = true,
  status,
  onToggle,
  assistantLabel = "AI Voice Assistant",
}: VoiceChatProps) {
  const controlled = status !== undefined;
  const [internal, setInternal] = useState<VoiceStatus>("idle");
  const current: VoiceStatus = controlled ? status : internal;
  const isListening = current === "listening";
  const isProcessing = current === "processing";
  const isSpeaking = current === "speaking";
  const active = isListening || isSpeaking;

  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  durationRef.current = duration;

  // Timer: one update per second while listening (cheap)
  useEffect(() => {
    if (!isListening) return;
    setDuration(0);
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [isListening]);

  // Optional volume callback, throttled
  useEffect(() => {
    if (!active || !onVolumeChange) return;
    const t = setInterval(() => onVolumeChange(Math.round(Math.random() * 100)), 250);
    return () => clearInterval(t);
  }, [active, onVolumeChange]);

  // Demo mode simulation (uncontrolled only)
  useEffect(() => {
    if (!demoMode || controlled) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(1000);
      while (!cancelled) {
        setInternal("listening");
        onStart?.();
        await wait(3000);
        if (cancelled) break;
        setInternal("processing");
        onStop?.(durationRef.current);
        await wait(2000);
        if (cancelled) break;
        setInternal("speaking");
        await wait(4000);
        if (cancelled) break;
        setInternal("idle");
        await wait(2000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, controlled, onStart, onStop]);

  const handleToggleListening = () => {
    if (controlled) return onToggle?.();
    if (demoMode) return;
    if (internal === "listening") {
      setInternal("idle");
      onStop?.(duration);
    } else {
      setInternal("listening");
      onStart?.();
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const statusText = isListening ? "Listening... tap to stop" : isProcessing ? "Thinking of a comeback..." : isSpeaking ? "Speaking... tap to skip" : "Tap to vent";
  const statusColor = isListening ? "text-blue-400" : isProcessing ? "text-yellow-400" : isSpeaking ? "text-green-400" : "text-muted-foreground";
  const barColor = isListening ? "bg-blue-500" : isProcessing ? "bg-yellow-500" : isSpeaking ? "bg-green-500" : "bg-muted";

  return (
    <div ref={rootRef} className={cn("flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden", !onScreen && "[&_*]:[animation-play-state:paused]", className)}>
      <Particles />

      {/* Background glow: transform/opacity only, GPU composited */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div
          className={cn(
            "vc-glow h-80 w-80 rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 blur-3xl",
            isListening && "vc-glow-active"
          )}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Main voice button */}
        <div className="relative">
          <motion.button
            onClick={handleToggleListening}
            aria-label={statusText}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full border-2 transition-[border-color,box-shadow] duration-200 md:h-32 md:w-32",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              isListening
                ? "border-blue-500 shadow-lg shadow-blue-500/25"
                : isProcessing
                ? "border-yellow-500 shadow-lg shadow-yellow-500/25"
                : isSpeaking
                ? "border-green-500 shadow-lg shadow-green-500/25"
                : "border-border hover:border-primary/50"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={current}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                className="flex"
              >
                {isProcessing ? (
                  <Loader2 className="h-11 w-11 animate-spin text-yellow-500" />
                ) : isSpeaking ? (
                  <Volume2 className="h-11 w-11 text-green-500" />
                ) : isListening ? (
                  <Mic className="h-11 w-11 text-blue-500" />
                ) : (
                  <Mic className="h-11 w-11 text-muted-foreground" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Pulse rings (CSS) */}
          {isListening && (
            <>
              <span className="vc-ring pointer-events-none absolute inset-0 rounded-full border-2 border-blue-500/40" />
              <span className="vc-ring pointer-events-none absolute inset-0 rounded-full border-2 border-blue-500/25 [animation-delay:0.5s]" />
            </>
          )}
        </div>

        {/* Waveform: CSS scaleY animation, no per-frame state */}
        <div className="flex h-14 items-center justify-center gap-1" aria-hidden>
          {BARS.map((b, i) => (
            <span
              key={i}
              className={cn("vc-bar h-14 w-1 origin-center rounded-full transition-colors duration-200", barColor, active ? "vc-bar-active opacity-100" : "opacity-30")}
              style={{ animationDelay: b.delay, animationDuration: b.duration, ["--peak" as string]: b.peak }}
            />
          ))}
        </div>

        {/* Status and timer */}
        <div className="space-y-1.5 text-center">
          <p className={cn("text-base font-medium transition-colors duration-200 md:text-lg", statusColor, (isListening || isProcessing || isSpeaking) && "vc-breathe")}>{statusText}</p>
          <p className="font-mono text-sm text-muted-foreground">{formatTime(duration)}</p>
          <div className={cn("flex items-center justify-center gap-2 transition-opacity duration-200", active ? "opacity-100" : "opacity-0")} aria-hidden>
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full w-full origin-left rounded-full bg-blue-500", active && "vc-volume")} />
            </div>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* AI indicator */}
        <div className="vc-breathe flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>{assistantLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Usage example
export default function VoiceChatDemo() {
  return (
    <VoiceChat
      onStart={() => console.log("Voice recording started")}
      onStop={(duration) => console.log(`Voice recording stopped after ${duration}s`)}
      onVolumeChange={(volume) => console.log(`Volume: ${volume}%`)}
      demoMode={true}
    />
  );
}
