import { NextResponse } from "next/server";

// Magic Hour AI voice generator: create a job, poll until the audio is ready, return its URL.
const API = "https://api.magichour.ai/v1";
const MAX_CHARS = 1200; // 0.1 credit per character, so cap spend per reply

const VOICES: Record<string, { voice: string; speed: number }> = {
  trump: { voice: "Donald Trump", speed: 1 },
  snoop: { voice: "Snoop Dogg", speed: 0.95 },
  amitabh: { voice: "Amitabh Bachchan", speed: 0.95 },
};

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
  if (!cfg || !prompt) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (prompt.length > MAX_CHARS) return NextResponse.json({ error: "too_long" }, { status: 413 });

  const atsSlug = Object.entries(ATS_VOICES).find(([k]) => personaId?.includes(k))?.[1];
  if (atsSlug) {
    const url = await anyToSpeech(atsSlug, prompt);
    if (url) return NextResponse.json({ url, provider: "anytospeech" });
  }

  const key = process.env.MAGIC_HOUR_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 503 });

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
