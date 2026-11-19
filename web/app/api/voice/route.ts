import { NextResponse } from "next/server";

// Magic Hour AI voice generator: create a job, poll until the audio is ready, return its URL.
const API = "https://api.magichour.ai/v1";
const MAX_CHARS = 1200; // 0.1 credit per character, so cap spend per reply

const VOICES: Record<string, { voice: string; speed: number }> = {
  trump: { voice: "Donald Trump", speed: 1 },
  snoop: { voice: "Snoop Dogg", speed: 0.95 },
  amitabh: { voice: "Amitabh Bachchan", speed: 0.95 },
};

// Fish Audio: main voice. Free model, ~2s, returns MP3 bytes (sent to the browser as a data URL).
const FISH_VOICES: Record<string, string> = {
  trump: "010da99c66f44d319159c8588315f22c",
  snoop: "36383de9db3944e99f6063ee16ee4b58",
  amitabh: "ea7cdc74aeae4b608be27fdc37fdcb05",
  modi: "03e679752fa54b778a189c9f4e9d1889",
};

async function fishAudio(referenceId: string, text: string): Promise<string | null> {
  const key = process.env.FISH_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", model: process.env.FISH_MODEL || "s2.1-pro-free" },
      body: JSON.stringify({ text, reference_id: referenceId, format: "mp3", latency: "balanced" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("audio")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return null;
    return `data:audio/mpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// AnyToSpeech (MCP over HTTP): synchronous, ~2s, returns an MP3 URL. Used first where it has the voice.
const ATS_VOICES: Record<string, string> = { trump: "donald-trump" };

async function anyToSpeech(slug: string, text: string): Promise<string | null> {
  const key = process.env.ANYTOSPEECH_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://anytospeech.com/api/mcp", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: "speech_synthesize", arguments: { text, famous_slug: slug } },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const raw = await res.text();
    const json = raw.trim().startsWith("{") ? raw : raw.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
    if (!json) return null;
    const out = JSON.parse(json) as { result?: { isError?: boolean; structuredContent?: { artifacts?: { url?: string }[] } } };
    if (out.result?.isError) return null;
    return out.result?.structuredContent?.artifacts?.find((a) => a.url)?.url ?? null;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { personaId, text } = (await req.json().catch(() => ({}))) as { personaId?: string; text?: string };
  const cfg = Object.entries(VOICES).find(([k]) => personaId?.includes(k))?.[1];
  const prompt = (text ?? "").trim();
  const known = [VOICES, FISH_VOICES, ATS_VOICES].some((m) => Object.keys(m).some((k) => personaId?.includes(k)));
  if (!known || !prompt) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (prompt.length > MAX_CHARS) return NextResponse.json({ error: "too_long" }, { status: 413 });

  const fishId = Object.entries(FISH_VOICES).find(([k]) => personaId?.includes(k))?.[1];
  if (fishId) {
    const url = await fishAudio(fishId, prompt);
    if (url) return NextResponse.json({ url, provider: "fish" });
  }

  const atsSlug = Object.entries(ATS_VOICES).find(([k]) => personaId?.includes(k))?.[1];
  if (atsSlug) {
    const url = await anyToSpeech(atsSlug, prompt);
    if (url) return NextResponse.json({ url, provider: "anytospeech" });
  }

  const key = process.env.MAGIC_HOUR_API_KEY;
  if (!key || !cfg) return NextResponse.json({ error: "no_voice" }, { status: 503 });

  const headers = { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" };
  try {
    const create = await fetch(`${API}/ai-voice-generator`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: `therapy-${personaId}`, style: { prompt, voice_name: cfg.voice, language: "english", speed: cfg.speed } }),
    });
    if (!create.ok) {
      const body = await create.text();
      return NextResponse.json({ error: "create_failed", status: create.status, detail: body.slice(0, 300) }, { status: 502 });
    }
    const { id } = (await create.json()) as { id: string };

    const deadline = Date.now() + 30_000;
    let wait = 900;
    while (Date.now() < deadline) {
      await sleep(wait);
      wait = Math.min(1500, wait + 200);
      const r = await fetch(`${API}/audio-projects/${id}`, { headers, cache: "no-store" });
      if (!r.ok) continue;
      const p = (await r.json()) as { status: string; downloads?: { url: string }[]; error?: { message?: string } | null };
      if (p.status === "complete" && p.downloads?.[0]?.url) return NextResponse.json({ url: p.downloads[0].url, provider: "magichour" });
      if (p.status === "error" || p.status === "canceled") return NextResponse.json({ error: p.error?.message ?? p.status }, { status: 502 });
    }
    return NextResponse.json({ error: "timeout" }, { status: 504 });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}
