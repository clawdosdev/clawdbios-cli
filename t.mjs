import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_KEY });
for (const model of ["anthropic/claude-fable-5","claude-fable-5","anthropic/fable-5"]) {
  try {
    const s = await fal.stream("openrouter/router",{ input:{ prompt:"say OK", model, temperature:1 }});
    for await (const _ of s){}
    const r = await s.done();
    const t = (r?.output ?? r?.text ?? r?.choices?.[0]?.message?.content ?? JSON.stringify(r)).toString().slice(0,60);
    console.log("OK   ", model, "->", t);
  } catch(e){ console.log("FAIL ", model, "->", (e?.body?.detail||e?.message||"").toString().slice(0,90)); }
}
