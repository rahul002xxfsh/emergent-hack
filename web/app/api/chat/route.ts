import { NextResponse } from "next/server";
import {
  personas, precheck, buildSystemPrompt, offlineReply, clampWords,
  MAX_REPLY_WORDS, type ChatMessage, type CategoryId,
} from "@/lib/therapy";
import { getClient, hasClaude, MODEL, describeError } from "@/lib/claude";

export async function POST(req: Request) {
  const body = (await req.json()) as { personaId: string; category: CategoryId; messages: ChatMessage[] };
  const persona = personas.find((p) => p.id === body.personaId);
  if (!persona) return NextResponse.json({ error: "Unknown persona" }, { status: 400 });

  const messages = (body.messages ?? []).slice(-16);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });

  const userTurns = messages.filter((m) => m.role === "user").length;
  const check = precheck(last.content, userTurns);
  if (!check.ok) return NextResponse.json({ reply: check.reply, code: check.code, source: "rules" });

  if (!hasClaude()) {
    return NextResponse.json({ reply: offlineReply(persona, body.category, last.content, userTurns - 1), source: "demo" });
  }

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 1200, // reply is capped at ~250 words by prompt + clampWords; headroom covers thinking
      system: buildSystemPrompt(persona, body.category),
      messages,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ reply: "Let's keep this about how you're feeling. What's stressing you out right now?", source: "refusal" });
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(" ").trim();
    return NextResponse.json({ reply: clampWords(text || "Tell me more.", MAX_REPLY_WORDS), source: "claude" });
  } catch (error) {
    console.error("chat error", describeError(error));
    return NextResponse.json({ reply: offlineReply(persona, body.category, last.content, userTurns - 1), source: "demo", error: describeError(error) });
  }
}
