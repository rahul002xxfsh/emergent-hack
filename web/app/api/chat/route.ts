import { NextResponse } from "next/server";
import { personas, precheck, offlineReply, clampWords, MAX_REPLY_WORDS, type ChatMessage, type CategoryId } from "@/lib/therapy";
import { rateLimit, parseBody, ChatBody } from "@/lib/guard";
import { checkBoundary, OFF_TOPIC_REPLY } from "@/lib/boundary";

// Chat replies come from the built-in, question-aware reply engine (lib/responder.ts).
// No external AI key is used anywhere in this project.
export async function POST(req: Request) {
  const limited = rateLimit(req, "chat", 20);
  if (limited) return limited;
  const parsed = await parseBody(req, ChatBody);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data as { personaId: string; category: CategoryId; messages: ChatMessage[] };

  const persona = personas.find((p) => p.id === body.personaId);
  if (!persona) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  // Count turns over the whole session (before trimming), so the 12-turn limit actually applies.
  const userTurns = body.messages.filter((m) => m.role === "user").length;
  const messages = body.messages.slice(-16);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const check = precheck(last.content, userTurns);
  if (!check.ok) return NextResponse.json({ reply: check.reply, code: check.code, source: "rules" });

  // Therapy-only boundary: off-topic or jailbreak messages get the fixed reply
  if (checkBoundary(last.content)) return NextResponse.json({ reply: OFF_TOPIC_REPLY, code: "off_topic", source: "rules" });

  const history = messages.filter((m) => m.role === "user").slice(0, -1).map((m) => m.content);
  const reply = offlineReply(persona, body.category, last.content, userTurns - 1, history);
  return NextResponse.json({ reply: clampWords(reply, MAX_REPLY_WORDS), source: "demo" });
}
