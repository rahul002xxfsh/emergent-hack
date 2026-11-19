import { NextResponse } from "next/server";
import { z } from "zod";
import { categories } from "@/lib/therapy";

// ---- Rate limiting (best effort, per server instance) ----
// Stops one visitor from spamming the API and burning voice / AI credits.
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

/** Returns a 429 response when `key` made more than `limit` calls in `windowMs`, else null. */
export function rateLimit(req: Request, bucket: string, limit: number, windowMs = 60_000): NextResponse | null {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    const retry = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return null;
}

// ---- Input validation ----
const categoryIds = categories.map((c) => c.id) as [string, ...string[]];
const message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2500),
});

export const ChatBody = z.object({
  personaId: z.string().max(64),
  category: z.enum(categoryIds),
  messages: z.array(message).min(1).max(40),
});

export const PrescriptionBody = z.object({
  personaId: z.string().max(64),
  category: z.enum(categoryIds),
  messages: z.array(message).max(60),
  stress: z.number().min(0).max(100).optional(),
});

export const VoiceBody = z.object({
  personaId: z.string().max(64),
  text: z.string().min(1).max(1200),
});

/** Parse JSON + validate; returns data or a 400 response (no internal details). */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  const raw = await req.json().catch(() => undefined);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: NextResponse.json({ error: "invalid_request" }, { status: 400 }) };
  return { data: parsed.data };
}
