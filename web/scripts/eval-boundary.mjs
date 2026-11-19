// Runs every case in data/boundary-dataset.json through /api/chat and checks the reply.
// Usage: node scripts/eval-boundary.mjs [baseUrl]   (default http://localhost:3100)
import { readFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3100";
const data = JSON.parse(readFileSync(new URL("../data/boundary-dataset.json", import.meta.url)));
const OFF = data.off_topic_reply;
const personas = ["donald-trump", "snoop-dogg", "amitabh-bachchan", "narendra-modi"];

const classify = (reply) => (reply === OFF ? "off_topic" : /14416/.test(reply) ? "crisis" : "therapy");

let pass = 0;
const fails = [];
const byGroup = {};
for (const [i, c] of data.cases.entries()) {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    // a distinct test IP per case so the per-visitor rate limit doesn't interfere locally
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.${Math.floor(i / 250)}.${i % 250}` },
    body: JSON.stringify({ personaId: personas[i % 4], category: "exams", messages: [{ role: "user", content: c.input }] }),
  });
  const { reply = "" } = await res.json();
  const got = classify(reply);
  const ok = got === c.expected;
  byGroup[c.group] ??= { pass: 0, total: 0 };
  byGroup[c.group].total++;
  if (ok) { pass++; byGroup[c.group].pass++; } else fails.push({ id: c.id, group: c.group, expected: c.expected, got, input: c.input });
}

console.log(`\n${pass}/${data.cases.length} passed (${((pass / data.cases.length) * 100).toFixed(1)}%)\n`);
for (const [g, r] of Object.entries(byGroup)) console.log(`${r.pass === r.total ? "✓" : "✗"} ${g.padEnd(20)} ${r.pass}/${r.total}`);
if (fails.length) {
  console.log("\nFailures:");
  for (const f of fails) console.log(`  ${f.id} [${f.group}] expected ${f.expected}, got ${f.got}: ${f.input}`);
  process.exitCode = 1;
}
