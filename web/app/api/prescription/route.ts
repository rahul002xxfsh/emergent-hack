import { NextResponse } from "next/server";
import { personas, offlinePrescription, type CategoryId } from "@/lib/therapy";
import { rateLimit, parseBody, PrescriptionBody } from "@/lib/guard";

// Session Prescription from the persona's built-in prescription for the chosen topic.
// No external AI key is used anywhere in this project.
export async function POST(req: Request) {
  const limited = rateLimit(req, "prescription", 8);
  if (limited) return limited;
  const parsed = await parseBody(req, PrescriptionBody);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data as { personaId: string; category: CategoryId };

  const persona = personas.find((p) => p.id === body.personaId);
  if (!persona) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  return NextResponse.json({ prescription: offlinePrescription(persona, body.category), source: "demo" });
}
