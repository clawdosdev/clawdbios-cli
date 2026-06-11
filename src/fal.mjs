import { fal } from "@fal-ai/client";
import { getConfig, getKey } from "./store.mjs";

let configured = false;
export function ensureFal() {
  const key = getKey();
  if (!key) return false;
  if (!configured) {
    fal.config({ credentials: key });
    configured = true;
  }
  return true;
}
const configure = ensureFal;

// One-shot completion (no streaming) — used by tools (code, web answer).
export async function falComplete(prompt, { temperature = 0.4 } = {}) {
  if (!configure()) throw new Error("NO_KEY");
  const { model } = getConfig();
  const stream = await fal.stream("openrouter/router", {
    input: { prompt, model: model || "anthropic/claude-sonnet-4.6", temperature, reasoning: false },
  });
  for await (const _ of stream) void _;
  const result = await stream.done();
  return String(extractText(result) || "").trim();
}

export { fal };

/** Pull any text out of a fal event/result, whatever shape it arrives in. */
export function extractText(ev) {
  if (!ev) return "";
  if (typeof ev === "string") return ev;
  const r = ev.data ?? ev;
  return (
    r.output ??
    r.text ??
    r.delta ??
    r.choices?.[0]?.delta?.content ??
    r.choices?.[0]?.message?.content ??
    r.message?.content ??
    r.content ??
    ""
  );
}

function buildPrompt(agent, history, userMsg) {
  const lines = [
    `# CHARACTER\n${agent.persona.trim()}`,
    `\nYou are "${agent.name}" (${agent.role}). Stay fully in character. Be vivid and concise.`,
    `\n# CONVERSATION`,
  ];
  for (const m of history.slice(-24)) {
    lines.push(`${m.role === "user" ? "User" : agent.name}: ${m.content}`);
  }
  lines.push(`User: ${userMsg}`);
  lines.push(`${agent.name}:`);
  return lines.join("\n");
}

/**
 * Stream a reply. Calls onDelta(textChunk) as tokens arrive; returns the full text.
 * Falls back cleanly if the stream yields no incremental text.
 */
export async function streamChat(agent, history, userMsg, onDelta) {
  if (!configure()) throw new Error("NO_KEY");
  const { model, temperature } = getConfig();
  const prompt = buildPrompt(agent, history, userMsg);

  const stream = await fal.stream("openrouter/router", {
    input: { prompt, model: model || "anthropic/claude-sonnet-4.6", temperature: temperature ?? 1 },
  });

  let printed = "";
  for await (const event of stream) {
    const t = extractText(event);
    if (!t) continue;
    if (t.length >= printed.length && t.startsWith(printed)) {
      onDelta(t.slice(printed.length)); // cumulative output
      printed = t;
    } else {
      onDelta(t); // delta-style chunk
      printed += t;
    }
  }

  const result = await stream.done();
  const final = extractText(result);
  if (final && final.length > printed.length && final.startsWith(printed)) {
    onDelta(final.slice(printed.length));
    printed = final;
  } else if (final && !printed) {
    onDelta(final);
    printed = final;
  }
  return printed.trim();
}
