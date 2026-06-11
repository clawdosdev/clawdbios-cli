import { fal, falComplete, ensureFal } from "./fal.mjs";

async function toolImage(prompt) {
  if (!ensureFal()) throw new Error("NO_KEY");
  const r = await fal.subscribe("fal-ai/flux/schnell", {
    input: { prompt, image_size: "square_hd", num_images: 1, num_inference_steps: 4 },
  });
  const url = r?.data?.images?.[0]?.url || r?.images?.[0]?.url;
  if (!url) throw new Error("image: no output");
  return { type: "image", url };
}

async function toolWeb(query) {
  const q = String(query || "").trim();
  let context = "";
  let source = "";
  if (/^https?:\/\//i.test(q)) {
    context = (await fetch("https://r.jina.ai/" + q, { signal: AbortSignal.timeout(20000) }).then((r) => r.text())).slice(0, 4500);
    source = q;
  } else {
    try {
      const j = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&t=clawdbios`, { signal: AbortSignal.timeout(15000) }).then((r) => r.json());
      const rel = (j.RelatedTopics || []).map((t) => t.Text).filter(Boolean).slice(0, 6);
      context = [j.Abstract, j.Definition, ...rel].filter(Boolean).join("\n");
      source = j.AbstractURL || j.DefinitionURL || "duckduckgo.com";
    } catch {}
    if (context.length < 80) {
      try {
        const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=1&origin=*`, { signal: AbortSignal.timeout(15000) }).then((r) => r.json());
        const title = s?.query?.search?.[0]?.title;
        if (title) {
          const e = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`, { signal: AbortSignal.timeout(15000) }).then((r) => r.json());
          const ex = Object.values(e?.query?.pages || {})[0]?.extract || "";
          if (ex) { context = ex.slice(0, 4000); source = "en.wikipedia.org/wiki/" + title.replace(/ /g, "_"); }
        }
      } catch {}
    }
  }
  if (!context) context = "(no clear result)";
  const text = await falComplete(`You searched the web for: "${q}".\n\n# CONTEXT\n${context}\n\nAnswer concisely using ONLY this context. If it's thin, say so — don't invent.`, { temperature: 0.5 });
  return { type: "web", text, source };
}

async function toolCode(task) {
  const text = await falComplete(`# CODE TASK\n${task}\n\nWrite clean, correct code. One short line of context, then a single fenced code block. No filler.`, { temperature: 0.25 });
  return { type: "code", text };
}

async function toolChain(input) {
  const m = String(input || "").match(/0x[a-fA-F0-9]{40}/);
  if (!m) return { type: "chain", text: "Give me a token contract address (0x…) on Base." };
  const ca = m[0];
  const j = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, { signal: AbortSignal.timeout(15000) }).then((r) => r.json());
  const p = (j.pairs || []).filter((x) => x.chainId === "base").sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || j.pairs?.[0];
  if (!p) return { type: "chain", text: `No DEX pair found for ${ca} on Base.` };
  const f = (n) => (n == null ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const text = [
    `${p.baseToken.name} ($${p.baseToken.symbol}) — Base`,
    `price $${p.priceUsd}  ·  24h ${p.priceChange?.h24 ?? "—"}%`,
    `liq $${f(p.liquidity?.usd)}  ·  FDV $${f(p.fdv)}  ·  vol24h $${f(p.volume?.h24)}`,
    p.url,
  ].join("\n");
  return { type: "chain", text };
}

export async function runTool(kind, input) {
  switch (kind) {
    case "image": return toolImage(input);
    case "web": return toolWeb(input);
    case "code": return toolCode(input);
    case "chain": return toolChain(input);
    default: throw new Error("unknown tool");
  }
}
