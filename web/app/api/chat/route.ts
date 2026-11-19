import { NextResponse } from "next/server";
import {
  personas, precheck, buildSystemPrompt, offlineReply, clampWords,
  MAX_REPLY_WORDS, type ChatMessage, type CategoryId,
} from "@/lib/therapy";
import { getClient, hasClaude, MODEL, describeError } from "@/lib/claude";
import { rateLimit, parseBody, ChatBody } from "@/lib/guard";
import { checkBoundary, OFF_TOPIC_REPLY } from "@/lib/boundary";

export async function POST(req: Request) {
  const limited = rateLimit(req, "chat", 20);
  if (limited) return limited;
  const parsed = await parseBody(req, ChatBody);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data as { personaId: string; category: CategoryId; messages: ChatMessage[] };
  const persona = personas.find((p) => p.id === body.personaId);
  if (!persona) return NextResponse.json({ error: "Unknown persona" }, { status: 400 });

  const messages = (body.messages ?? []).slice(-16);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });

  const userTurns = messages.filter((m) => m.role === "user").length;
  const check = precheck(last.content, userTurns);
  if (!check.ok) return NextResponse.json({ reply: check.reply, code: check.code, source: "rules" });

  // Therapy-only boundary: clear off-topic or jailbreak messages get the fixed reply, no AI call
  const hit = checkBoundary(last.content);
  if (hit) return NextResponse.json({ reply: OFF_TOPIC_REPLY, code: "off_topic", source: "rules" });

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
    // Safety net: if the model used the off-topic sentence, send only that sentence
    if (text.includes("not something we are here to discuss")) {
      return NextResponse.json({ reply: OFF_TOPIC_REPLY, code: "off_topic", source: "claude" });
    }
    return NextResponse.json({ reply: clampWords(text || "Tell me more.", MAX_REPLY_WORDS), source: "claude" });
  } catch (error) {
    console.error("chat error", describeError(error));
    return NextResponse.json({ reply: offlineReply(persona, body.category, last.content, userTurns - 1), source: "demo" });
  }
}
