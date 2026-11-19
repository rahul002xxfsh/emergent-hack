"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, Share2, RotateCcw, Send, Stethoscope, Keyboard, ShieldAlert, Home, Users, Mic, FileText, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimeNavBar } from "@/components/ui/anime-navbar";
import { scrollToSection } from "@/lib/scroll";
import MetroHero, { CouchPanel } from "@/components/ui/scroll-locked-video-hero";
import { CircularTestimonials } from "@/components/ui/circular-testimonials";
import { SplineScene } from "@/components/ui/splite";
import { Therapist3D } from "@/components/ui/therapist-3d";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { VoiceChat, type VoiceStatus } from "@/components/ui/voice-chat";
import { LiveCaption, caption } from "@/components/ui/live-caption";
import {
  personas, personaColors, categories, countWords, stressScore, stressLabel,
  MAX_INPUT_WORDS, type ChatMessage, type CategoryId,
} from "@/lib/therapy";

type Prescription = { diagnosis: string; three_step_rx: string[]; signoff: string };

// Minimal typing for the browser Speech Recognition API
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const britishVoices = new Set<string>([]);

const personaCards = personas.map((p) => ({
  quote: `“${p.greeting}”`,
  name: p.name,
  designation: `${p.title} · ${p.therapy_style_tag}`,
  src: `/personas/${p.id}.jpg`,
}));

const navItems = [
  { name: "Home", url: "#home", icon: Home },
  { name: "Therapists", url: "#personas", icon: Users },
  { name: "Session", url: "#session", icon: Mic },
  { name: "Prescription", url: "#prescription", icon: FileText },
];

function scrollToId(id: string) {
  scrollToSection(id);
}

export default function Landing() {
  const [personaIndex, setPersonaIndex] = useState(0);
  const persona = personas[personaIndex] ?? personas[0];
  const color = (persona?.id && personaColors[persona.id]) ? personaColors[persona.id] : personaColors["donald-trump"];
  const [category, setCategory] = useState<CategoryId>("exams");
  const [stageMode, setStageMode] = useState<"therapist" | "robot">("therapist");
  const [activeSection, setActiveSection] = useState("Home");
  const navLockRef = useRef(false); // true while a nav click is scrolling, so the highlight doesn't flicker

  // Scroll-spy: highlight the nav item for the section in view
  useEffect(() => {
    const ids = navItems.map((n) => n.url.slice(1));
    const onScroll = () => {
      if (navLockRef.current) return;
      const probe = window.innerHeight * 0.35;
      let current = "Home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = navItems.find((n) => n.url === `#${id}`)!.name;
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [rxLoading, setRxLoading] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const logRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const statusRef = useRef<VoiceStatus>("idle");
  statusRef.current = status;
  const inputRef = useRef<HTMLInputElement>(null);
  const [rxNotice, setRxNotice] = useState<string | null>(null);

  const userTexts = useMemo(() => messages.filter((m) => m.role === "user").map((m) => m.content), [messages]);
  const stress = useMemo(() => stressScore(userTexts), [userTexts]);
  const inputWords = countWords(input);
  const lastReply = [...messages].reverse().find((m) => m.role === "assistant")?.content;

  // Warm up the voice list so the first reply already uses the right accent
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.getVoices();
    const warm = () => synth.getVoices();
    synth.addEventListener?.("voiceschanged", warm);
    return () => synth.removeEventListener?.("voiceschanged", warm);
  }, []);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim]);

  // Real celebrity-style voice (Magic Hour), generated only when a reply arrives. Falls back to the browser voice.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakIdRef = useRef(0);
  const voiceCacheRef = useRef(new Map<string, string>());
  // One shared <audio> element, unlocked during the user's click, so the voice can still
  // play a few seconds later when it arrives (browsers block late, gesture-less playback).
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const unlockAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    const a = playerRef.current ?? (playerRef.current = new Audio());
    if (a.dataset.unlocked) return;
    a.src = SILENT_WAV;
    a.play().then(() => { a.dataset.unlocked = "1"; }).catch(() => {});
  }, []);
  const [greet, setGreet] = useState<"idle" | "loading" | "playing">("idle");
  const stopVoice = useCallback(() => {
    speakIdRef.current++;
    setGreet("idle");
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    caption.stop();
  }, []);

  // New persona or topic = new session
  const resetSession = useCallback(() => {
    stopVoice();
    recognitionRef.current?.stop();
    setMessages([]);
    setPrescription(null);
    setStatus("idle");
    setNotice(null);
    setSource(null);
  }, [stopVoice]);

  useEffect(() => {
    resetSession();
  }, [personaIndex, category, resetSession]);

  const playRealAudio = useCallback(
    (clipSrc?: string) => {
      if (typeof window === "undefined") return;
      const clips = (persona as unknown as { audio_clips?: Array<{ title: string; src: string }> })?.audio_clips;
      const src = clipSrc || (Array.isArray(clips) && clips.length > 0 ? clips[0]?.src : null);
      if (!src) return;
      try {
        stopVoice();
        const id = speakIdRef.current;
        const audio = new Audio(src);
        audioRef.current = audio;
        setStatus("speaking");
        audio.onended = () => id === speakIdRef.current && setStatus("idle");
        audio.onerror = () => id === speakIdRef.current && setStatus("idle");
        audio.play().catch(() => id === speakIdRef.current && setStatus("idle"));
      } catch {
        setStatus("idle");
      }
    },
    [persona, stopVoice]
  );

  const browserSpeak = useCallback(
    (text: string, id: number) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth || id !== speakIdRef.current) {
        if (id === speakIdRef.current) setStatus("idle");
        return;
      }
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (persona?.voice_config) {
          u.pitch = persona.voice_config.pitch ?? 1;
          u.rate = persona.voice_config.rate ?? 1;
        }
        const voices = Array.isArray(synth.getVoices?.()) ? synth.getVoices() : [];
        const wanted = britishVoices.has(persona?.id ?? "") ? "en-GB" : "en-US";
        // Prioritize modern natural / neural / google voices safely
        const natural = voices.find(
          (v) =>
            v &&
            typeof v.lang === "string" &&
            typeof v.name === "string" &&
            (v.lang === wanted || v.lang.startsWith(wanted)) &&
            (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Google") || v.name.includes("Online"))
        );
        u.voice = natural ?? voices.find((v) => v?.lang === wanted) ?? voices.find((v) => v?.lang?.startsWith?.("en")) ?? null;
        u.onend = () => {
          if (id !== speakIdRef.current) return;
          caption.finish();
          setStatus("idle");
        };
        u.onerror = () => {
          if (id !== speakIdRef.current) return;
          caption.stop();
          setStatus("idle");
        };
        u.onboundary = (e) => id === speakIdRef.current && caption.boundary(e.charIndex, e.charLength);
        setStatus("speaking");
        caption.followSpeech(text, persona?.name ?? "", personaColors[persona?.id ?? ""]?.accent ?? "#fff", u.rate);
        synth.speak(u);
      } catch {
        setStatus("idle");
      }
    },
    [persona]
  );

  const speak = useCallback(
    async (text: string) => {
      stopVoice();
      const id = speakIdRef.current;
      const cacheKey = `${persona.id}|${text}`;
      setStatus("processing");
      let url = voiceCacheRef.current.get(cacheKey);
      if (!url) {
        try {
          const res = await fetch("/api/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personaId: persona.id, text }),
          });
          const data = (await res.json()) as { url?: string };
          if (data.url) {
            url = data.url;
            voiceCacheRef.current.set(cacheKey, url);
          }
        } catch {
          /* fall through to browser voice */
        }
      }
      if (id !== speakIdRef.current) return; // user moved on
      if (!url) return browserSpeak(text, id);
      const audio = playerRef.current ?? new Audio();
      audio.pause();
      audio.src = url;
      audioRef.current = audio;
      audio.onended = () => {
        if (id !== speakIdRef.current) return;
        caption.finish();
        setStatus("idle");
      };
      audio.onerror = () => id === speakIdRef.current && browserSpeak(text, id);
      setStatus("speaking");
      caption.followAudio(text, persona.name, personaColors[persona.id]?.accent ?? "#fff", audio);
      audio.play().catch(() => id === speakIdRef.current && browserSpeak(text, id));
    },
    [persona.id, persona.name, stopVoice, browserSpeak]
  );

  // Hero "Now on the couch" mic: speak the selected therapist's greeting in their Fish voice.
  const playGreeting = useCallback(async () => {
    if (greet !== "idle") {
      stopVoice();
      return;
    }
    unlockAudio();
    stopVoice();
    const id = speakIdRef.current;
    const text = persona.greeting;
    const cacheKey = `${persona.id}|${text}`;
    setGreet("loading");
    let url = voiceCacheRef.current.get(cacheKey);
    if (!url) {
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: persona.id, text }),
        });
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          url = data.url;
          voiceCacheRef.current.set(cacheKey, url);
        }
      } catch {
        /* fall back below */
      }
    }
    if (id !== speakIdRef.current) return;
    const done = () => {
      if (id !== speakIdRef.current) return;
      setGreet("idle");
    };
    if (!url) {
      const synth = window.speechSynthesis;
      if (!synth) return done();
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = persona.voice_config?.pitch ?? 1;
      u.rate = persona.voice_config?.rate ?? 1;
      u.onend = done;
      u.onerror = done;
      setGreet("playing");
      synth.speak(u);
      return;
    }
    const audio = playerRef.current ?? new Audio();
    audio.pause();
    audio.src = url;
    audioRef.current = audio;
    audio.onended = done;
    audio.onerror = done;
    setGreet("playing");
    audio.play().catch(done);
  }, [greet, persona, stopVoice, unlockAudio]);

  const send = useCallback(
    async (text: string) => {
      unlockAudio();
      const clean = text.trim();
      if (!clean || statusRef.current === "processing") return;
      if (countWords(clean) > MAX_INPUT_WORDS) {
        setNotice(`Keep it under ${MAX_INPUT_WORDS} words.`);
        return;
      }
      setNotice(null);
      const next: ChatMessage[] = [...messagesRef.current, { role: "user", content: clean }];
      setMessages(next);
      setInput("");
      setStatus("processing");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: persona.id, category, messages: next }),
        });
        const data = (await res.json()) as { reply?: string; source?: string; code?: string };
        const reply = data.reply ?? "The couch lost signal. Try again.";
        setSource(data.source ?? null);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        speak(reply);
      } catch {
        setStatus("idle");
        setNotice("Couldn't reach the therapist. Check your connection and try again.");
      }
    },
    [persona.id, category, speak, unlockAudio]
  );

  const toggleMic = useCallback(() => {
    unlockAudio();
    if (status === "speaking") {
      stopVoice();
      setStatus("idle");
      return;
    }
    if (status === "processing") return;
    if (status === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceSupported(false);
      setNotice("Voice input isn't supported in this browser. Type below instead (Chrome works best for voice).");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    transcriptRef.current = "";
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) transcriptRef.current += finalText + " ";
      setInterim((transcriptRef.current + interimText).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setNotice("Mic permission was blocked. Allow it in the address bar, or type below.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setNotice(`Mic error: ${e.error}. You can type instead.`);
    };
    rec.onend = () => {
      const said = transcriptRef.current.trim();
      setInterim("");
      if (said) send(said);
      else setStatus("idle");
    };
    recognitionRef.current = rec;
    stopVoice();
    setStatus("listening");
    rec.start();
  }, [status, send, stopVoice, unlockAudio]);

  const endSession = useCallback(async () => {
    stopVoice();
    setStatus("idle");
    setRxLoading(true);
    try {
      const res = await fetch("/api/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id, category, messages: messagesRef.current, stress }),
      });
      const data = (await res.json()) as { prescription: Prescription };
      setPrescription(data.prescription);
      setTimeout(() => scrollToId("prescription"), 150);
    } finally {
      setRxLoading(false);
    }
  }, [persona.id, category, stress, stopVoice]);

  const flashRx = useCallback((msg: string) => {
    setRxNotice(msg);
    window.setTimeout(() => setRxNotice((m) => (m === msg ? null : m)), 2500);
  }, []);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fbf7f0" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-prescription-${persona.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      flashRx("Saved as an image.");
    } catch {
      flashRx("Couldn't create the image. Try again or take a screenshot.");
    }
  }, [persona.id, flashRx]);

  const shareCard = useCallback(async () => {
    const rx = prescription ?? persona.sample_prescription;
    const text = `My parody therapist ${persona.name} diagnosed me with: ${rx.diagnosis} Try Celebrity Persona Therapist.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Session Prescription", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      flashRx("Copied. Paste it anywhere to share.");
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return; // user closed the share sheet
      flashRx("Couldn't share from this browser. Use Download instead.");
    }
  }, [prescription, persona, flashRx]);

  const shownRx = prescription ?? persona?.sample_prescription ?? personas[0].sample_prescription;
  const categoryLabel = categories.find((c) => c.id === category)?.label;

  return (
    <main className="dark bg-[#050505] text-neutral-100">
      <AnimeNavBar
        items={navItems}
        active={activeSection}
        accent={color.accent}
        onSelect={(item) => {
          navLockRef.current = true;
          setActiveSection(item.name);
          scrollToSection(item.url.slice(1), () => {
            navLockRef.current = false;
          });
          return true;
        }}
      />

      {/* 1. Intro */}
      <MetroHero onStart={() => scrollToId("personas")} />

      {/* 2. Now on the couch + Pick your therapist, side by side */}
      <section id="personas" className="relative scroll-mt-24 overflow-x-clip px-4 pb-24 pt-8 md:pt-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Step 1</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">Pick your therapist</h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400">Four parody personas. Each one has its own voice, style and very questionable bedside manner. Tap the mic to hear them.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-28">
            <CouchPanel persona={persona} greet={greet} onMic={playGreeting} />
          </div>
          <div className="flex justify-center rounded-3xl border border-white/10 bg-[#0b0b0f] p-4 md:p-8">
              <CircularTestimonials
                stacked
                testimonials={personaCards}
                autoplay={false}
                onChange={setPersonaIndex}
                colors={{
                  name: "#f7f7ff",
                  designation: color.text,
                  testimony: "#e5e5ea",
                  arrowBackground: color.accent,
                  arrowForeground: "#0a0a0a",
                  arrowHoverBackground: "#f7f7ff",
                }}
                fontSizes={{ name: "30px", designation: "16px", quote: "20px" }}
                footer={
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.25em] text-neutral-500">Step 2 · What&apos;s stressing you?</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCategory(c.id)}
                          title={c.hint}
                          className="rounded-full border px-3 py-1.5 text-sm transition duration-150 active:scale-95"
                          style={
                            category === c.id
                              ? { background: color.accent, borderColor: color.accent, color: "#0a0a0a" }
                              : { borderColor: "rgba(255,255,255,0.15)", color: "#d4d4d8" }
                          }
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => scrollToId("session")}
                      className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-black transition-transform duration-150 hover:scale-105 active:scale-95"
                      style={{ background: color.accent }}
                    >
                      Start session with {persona.name.split(" ")[0]}
                    </button>
                  </div>
                }
              />
          </div>
        </div>
      </section>

      {/* 4. The couch: voice session */}
      <section id="session" className="scroll-mt-24 px-4 py-16">
        <div className="mx-auto mb-10 max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Step 3</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">The couch</h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400">Tap the mic and rant, or type. {persona.name} replies out loud, in character.</p>
        </div>

        <Card className="relative mx-auto w-full max-w-6xl overflow-hidden border-white/10 bg-black/[0.96]">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill={color.accent} />

          {/* Session header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-8">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/personas/${persona.id}.jpg`} alt={persona.name} className="h-11 w-11 rounded-xl object-cover object-top" />
              <div>
                <p className="font-semibold">{persona.name}</p>
                <p className="text-xs" style={{ color: color.text }}>{persona.title} · {categoryLabel}</p>
              </div>
            </div>
            <div className="min-w-[220px] flex-1 md:max-w-xs">
              <div className="mb-1 flex justify-between text-xs text-neutral-400">
                <span>Stress meter</span>
                <span>{stress}/100 · {stressLabel(stress)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"
                  initial={{ width: "3%" }}
                  animate={{ width: `${Math.max(3, stress)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:h-[700px] md:flex-row">
            {/* Left: voice chat + transcript */}
            <div className="relative z-10 flex flex-1 flex-col p-5 md:p-8">
              <VoiceChat
                status={status}
                onToggle={toggleMic}
                demoMode={false}
                assistantLabel={`${persona.name} · parody therapist`}
                className="min-h-0 h-[360px] bg-transparent"
              />

              {/* Real Celebrity Voice Clips Soundboard */}
              {Array.isArray((persona as unknown as { audio_clips?: Array<{ title: string; src: string }> })?.audio_clips) &&
                ((persona as unknown as { audio_clips: Array<{ title: string; src: string }> }).audio_clips.length > 0) && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-white/5 pt-2">
                  <span className="text-[11px] font-mono text-amber-400/90">🎙️ Actual Voice:</span>
                  {(persona as unknown as { audio_clips: Array<{ title: string; src: string }> }).audio_clips.map((clip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => playRealAudio(clip.src)}
                      className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-0.5 text-xs text-amber-300 hover:bg-amber-900/60 hover:text-white transition shadow-sm active:scale-95"
                      title={`Play real ${persona?.name} audio`}
                    >
                      🔊 {clip.title}
                    </button>
                  ))}
                </div>
              )}

              <div ref={logRef} className="mt-2 h-48 space-y-2 overflow-y-auto pr-1 md:h-auto md:flex-1">
                {messages.length === 0 && !interim && (
                  <p className="text-center text-sm text-neutral-500">“{persona.greeting}”</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <p
                      className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                      style={
                        m.role === "user"
                          ? { background: "rgba(255,255,255,0.08)" }
                          : { background: color.soft, color: color.text }
                      }
                    >
                      {m.content}
                    </p>
                  </div>
                ))}
                {interim && (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl bg-white/5 px-3 py-2 text-sm italic text-neutral-400">{interim}…</p>
                  </div>
                )}
              </div>

              {notice && <p className="mt-2 text-xs text-amber-300">{notice}</p>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Keyboard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    ref={inputRef}
                    placeholder={voiceSupported ? "Or type your rant…" : "Type your rant…"}
                    className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-16 text-sm outline-none transition-colors focus:border-white/30"
                    maxLength={2000}
                    enterKeyHint="send"
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${inputWords > MAX_INPUT_WORDS ? "text-red-400" : "text-neutral-500"}`}>
                    {inputWords}/{MAX_INPUT_WORDS}
                  </span>
                </div>
                <button type="submit" aria-label="Send" disabled={status === "processing" || !input.trim() || inputWords > MAX_INPUT_WORDS} className="rounded-full bg-white p-2.5 text-black transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100">
                  <Send className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={endSession}
                  disabled={rxLoading || messages.length === 0 || status === "processing"}
                  className="w-full rounded-full border border-white/20 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-40 sm:w-auto"
                >
                  {rxLoading ? "Writing Rx…" : "End session"}
                </button>
              </form>
              {source === "demo" && (
                <p className="mt-2 text-[11px] text-neutral-500">Demo mode: your therapist is running on scripted parody lines today.</p>
              )}
            </div>

            {/* Right: 3D therapist */}
            <div className="relative h-[400px] flex-1 md:h-full overflow-hidden rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl bg-gradient-to-b from-black/20 to-black/60">
              {/* 3D Model Switcher Pill */}
              <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setStageMode("therapist")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    stageMode === "therapist"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="3D Human Therapist character"
                >
                  👨‍⚕️ 3D Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode("robot")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    stageMode === "robot"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="3D Robot model"
                >
                  🤖 3D Robot
                </button>
              </div>

              {stageMode === "therapist" ? (
                <Therapist3D
                  status={status}
                  accentColor={color.accent}
                  personaName={persona.name}
                  modelUrl="/models/therapist.glb"
                  className="h-full w-full"
                />
              ) : (
                <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
              )}

              {lastReply && (
                <motion.div
                  key={lastReply}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm backdrop-blur"
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: color.text }}>Last reply</p>
                  <p className="line-clamp-4 text-neutral-200">{lastReply}</p>
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Session prescription */}
      <section id="prescription" className="scroll-mt-24 px-4 pb-20 pt-16">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Step 4</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">Your Session Prescription</h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400">
            {prescription ? "Written from your session. Download it or send it to the friend who needs it more." : "Locked until you finish a session. Talk to " + persona.name + ", then hit End session to reveal yours."}
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="relative">
          <div
            ref={cardRef}
            aria-hidden={!prescription}
            className={cn(
              "relative overflow-hidden rounded-3xl border-2 border-dashed p-7 transition-[filter,opacity] duration-700 ease-out",
              !prescription && "pointer-events-none select-none blur-md opacity-70"
            )}
            style={{ borderColor: color.accent, background: "#fbf7f0", color: "#1c1917" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: color.accent }}>Rx · Session prescription</p>
                <p className="mt-1 text-lg font-bold">Dr. {persona.name}</p>
                <p className="text-xs text-stone-500">{persona.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6" style={{ color: color.accent }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/personas/${persona.id}.jpg`} alt="" className="h-12 w-12 rounded-full border-2 object-cover object-top" style={{ borderColor: color.accent }} />
              </div>
            </div>
            <div className="my-4 border-t border-stone-300" />
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Topic · Stress level</p>
            <p className="text-sm">{categoryLabel} · {stress}/100 ({stressLabel(stress)})</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Diagnosis</p>
            <p className="text-sm font-medium">{shownRx.diagnosis}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Three-step Rx</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {shownRx.three_step_rx.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm italic text-stone-600">{shownRx.signoff}</p>
            <span className="absolute bottom-6 right-5 -rotate-12 rounded-md border-2 px-2 py-0.5 text-sm font-black tracking-widest" style={{ borderColor: color.accent, color: color.accent }}>
              PARODY
            </span>
          </div>
          {!prescription && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/30 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70" style={{ boxShadow: `0 0 24px ${color.accent}66` }}>
                {rxLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Lock className="h-5 w-5 text-white" />}
              </span>
              <p className="text-base font-semibold text-white drop-shadow">{rxLoading ? "Writing your prescription…" : "Finish your session to unlock"}</p>
              {!rxLoading && (
                <button
                  onClick={() => scrollToId("session")}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-black transition duration-150 hover:brightness-110 active:scale-[0.97]"
                  style={{ background: color.accent }}
                >
                  Go to session
                </button>
              )}
            </div>
          )}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={downloadCard} disabled={!prescription} className="disabled:pointer-events-none disabled:opacity-40 flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm transition duration-150 hover:bg-white/10 active:scale-[0.97]">
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={shareCard} disabled={!prescription} className="disabled:pointer-events-none disabled:opacity-40 flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-black transition duration-150 hover:brightness-110 active:scale-[0.97]" style={{ background: color.accent }}>
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <p className="mt-3 h-4 text-center text-xs text-neutral-400" aria-live="polite">{rxNotice}</p>
          <button onClick={() => { resetSession(); scrollToId("personas"); }} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm text-neutral-400 hover:text-white">
            <RotateCcw className="h-4 w-4" /> Try another therapist
          </button>
        </div>
      </section>

      {/* Footer / safety */}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-neutral-500">
        <p className="flex items-center justify-center gap-2 text-neutral-400">
          <ShieldAlert className="h-4 w-4" /> Parody and entertainment only. Not real therapy, not affiliated with or endorsed by any celebrity.
        </p>
        <p className="mt-2">Struggling for real? Call Tele-MANAS 14416 (free, 24x7, India) or 112 in an emergency.</p>
        <p className="mt-4 text-neutral-600">Built by BakBak Bots · SSB x Emergent Vibe Coding Hackathon 2026</p>
        <p className="mx-auto mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-600">
          Photos via Wikimedia Commons, used under their licences; no endorsement implied:{" "}
          <a className="underline hover:text-neutral-400" href="https://commons.wikimedia.org/wiki/File:Official_Presidential_Portrait_of_President_Donald_J._Trump_(2025).jpg" target="_blank" rel="noreferrer">Donald Trump</a> (Daniel Torok, public domain),{" "}
          <a className="underline hover:text-neutral-400" href="https://commons.wikimedia.org/wiki/File:Snoop_Dogg,_WrestleMania_XL_(cropped)_(cropped).jpg" target="_blank" rel="noreferrer">Snoop Dogg</a> (Diego Serrano, CC BY 2.0),{" "}
          <a className="underline hover:text-neutral-400" href="https://commons.wikimedia.org/wiki/File:Indian_actor_Amitabh_Bachchan.jpg" target="_blank" rel="noreferrer">Amitabh Bachchan</a> (Shrinivaskulkarni1388 / Junior Jumper, CC BY-SA 4.0),{" "}
          <a className="underline hover:text-neutral-400" href="https://commons.wikimedia.org/wiki/File:The_official_portrait_of_Shri_Narendra_Modi,_the_Prime_Minister_of_the_Republic_of_India.jpg" target="_blank" rel="noreferrer">Narendra Modi</a> (Prime Minister&apos;s Office, GODL-India),{" "}
          <a className="underline hover:text-neutral-400" href="https://commons.wikimedia.org/wiki/File:Freud_Museum_(Couch_and_Office)_in_2024.jpg" target="_blank" rel="noreferrer">therapy couch</a> (Marcelo, public domain).
        </p>
      </footer>
      <LiveCaption />
    </main>
  );
}
