import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { personas, buildPrescriptionPrompt, offlinePrescription, type ChatMessage, type CategoryId } from "@/lib/therapy";
import { getClient, hasClaude, MODEL, describeError } from "@/lib/claude";

const Prescription = z.object({
  diagnosis: z.string(),
  three_step_rx: z.array(z.string()),
  signoff: z.string(),
});

export async function POST(req: Request) {
  const body = (await req.json()) as { personaId: string; category: CategoryId; messages: ChatMessage[]; stress: number };
  const persona = personas.find((p) => p.id === body.personaId);
  if (!persona) return NextResponse.json({ error: "Unknown persona" }, { status: 400 });

  const transcript = (body.messages ?? [])
    .slice(-24)
    .map((m) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
    .join("\n");

  if (!hasClaude() || !transcript) {
    return NextResponse.json({ prescription: offlinePrescription(persona, body.category), source: "demo" });
  }

  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 1500,
      system: buildPrescriptionPrompt(persona, body.category, body.stress ?? 0),
      messages: [{ role: "user", content: `Conversation:\n${transcript}` }],
      output_config: { effort: "low", format: zodOutputFormat(Prescription) },
    });
    const p = response.parsed_output;
    if (!p || p.three_step_rx.length < 3) throw new Error("bad prescription");
    return NextResponse.json({ prescription: { ...p, three_step_rx: p.three_step_rx.slice(0, 3) }, source: "claude" });
  } catch (error) {
    console.error("prescription error", describeError(error));
    return NextResponse.json({ prescription: offlinePrescription(persona, body.category), source: "demo" });
  }
}
