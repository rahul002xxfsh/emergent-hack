import { NextResponse } from "next/server";
import { rateLimit, parseBody, VoiceBody } from "@/lib/guard";

// Fish Audio text-to-speech: each therapist reply is spoken in that persona's Fish library voice.
// Free model (s2.1-pro-free), ~1-2 s, MP3 returned to the browser as a data URL.
// If Fish fails, the client falls back to the browser's built-in voice.
const MAX_CHARS = 1200;
const FISH_MODEL = "s2.1-pro-free";

const FISH_VOICES: Record<string, string> = {
  trump: "010da99c66f44d319159c8588315f22c",
  snoop: "36383de9db3944e99f6063ee16ee4b58",
  amitabh: "ea7cdc74aeae4b608be27fdc37fdcb05",
  modi: "03e679752fa54b778a189c9f4e9d1889",
};

export async function POST(req: Request) {
  const key = process.env.FISH_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 503 });

  const limited = rateLimit(req, "voice", 15);
  if (limited) return limited;
  const parsed = await parseBody(req, VoiceBody);
  if ("error" in parsed) return parsed.error;
  const { personaId, text } = parsed.data;
  const referenceId = Object.entries(FISH_VOICES).find(([k]) => personaId?.includes(k))?.[1];
  const prompt = (text ?? "").trim();
  if (!referenceId || !prompt) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (prompt.length > MAX_CHARS) return NextResponse.json({ error: "too_long" }, { status: 413 });

  try {
    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", model: FISH_MODEL },
      body: JSON.stringify({ text: prompt, reference_id: referenceId, format: "mp3", latency: "balanced" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("audio")) {
      return NextResponse.json({ error: "voice_unavailable" }, { status: 502 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return NextResponse.json({ error: "voice_unavailable" }, { status: 502 });
    return NextResponse.json({ url: `data:audio/mpeg;base64,${buf.toString("base64")}`, provider: "fish" });
  } catch {
    return NextResponse.json({ error: "voice_unavailable" }, { status: 502 });
  }
}
