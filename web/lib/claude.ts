import Anthropic from "@anthropic-ai/sdk";

// Default model per project guidance; override with CLAUDE_MODEL (e.g. claude-haiku-5-5) to cut cost.
export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "auth";
  if (error instanceof Anthropic.RateLimitError) return "rate_limited";
  if (error instanceof Anthropic.BadRequestError) return "bad_request";
  if (error instanceof Anthropic.APIError) return `api_${error.status}`;
  return "unknown";
}
