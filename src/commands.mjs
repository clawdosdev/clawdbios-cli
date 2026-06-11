import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { renderBanner, renderMiniHeader } from "./banner.mjs";
import { red, redBright, redDim, ember, ink, inkDim, green, marble, dim, bold } from "./theme.mjs";
import { listAgents, addAgent, findAgent, removeAgent, setConfig, getKey } from "./store.mjs";
import { streamChat } from "./fal.mjs";
import { runTool } from "./tools.mjs";

const log = (s = "") => stdout.write(s + "\n");

/* Queue-based line reader — works on a TTY and on piped stdin (where multiple
   lines can arrive before we ask). Returns { ask, close }. */
function reader() {
  const i = readline.createInterface({ input: stdin, output: stdout });
  const q = [];
  let waiter = null, closed = false;
  i.on("line", (l) => { if (waiter) { const w = waiter; waiter = null; w(l); } else q.push(l); });
  i.on("close", () => { closed = true; if (waiter) { const w = waiter; waiter = null; w(""); } });
  const ask = (prompt = "") => new Promise((res) => {
    if (prompt) stdout.write(prompt);
    if (q.length) return res(String(q.shift()).trim());
    if (closed) return res("");
    waiter = (l) => res(String(l || "").trim());
  });
  return { ask, close: () => i.close() };
}

const PRESETS = {
  hermes: { role: "Research Daemon", persona: "You are Hermes, a sharp autonomous research daemon. Quiet technical confidence, no wasted words, always cite your reasoning." },
  vulcan: { role: "Code Smith", persona: "You are Vulcan, a pragmatic coding agent. You write clean working code, explain trade-offs briefly, prefer the simplest thing that works." },
  oracle: { role: "Strategy Mind", persona: "You are Oracle, a strategic advisor. You think in systems, surface second-order effects, give crisp opinionated calls." },
};

export function showBanner() {
  log(renderBanner());
}

export function listCmd() {
  const agents = listAgents();
  if (!agents.length) {
    log(inkDim("  no agents flashed yet. run ") + redBright("clawdbios create") + inkDim(" to deploy one."));
    return;
  }
  log(red("  DEPLOYED AGENTS\n"));
  for (const a of agents) {
    log(`  ${redBright(a.name)} ${ink("·")} ${marble(a.role)}`);
    log(`  ${inkDim(a.id + " · " + a.bootMode)}\n`);
  }
}

export async function createCmd() {
  const { ask, close } = reader();
  log(ember("\n  ⌁ FLASH NEW AGENT") + inkDim("   (presets: hermes · vulcan · oracle, or write your own)\n"));
  let name = await ask(red("  name      › "));
  if (!name) { close(); return log(inkDim("  cancelled.")); }
  const presetKey = name.toLowerCase();
  let role, persona;
  if (PRESETS[presetKey]) {
    ({ role, persona } = PRESETS[presetKey]);
    name = name[0].toUpperCase() + name.slice(1);
    log(inkDim(`  loaded preset character for ${name}.`));
  } else {
    role = (await ask(red("  role      › "))) || "Autonomous Agent";
    log(inkDim("  describe the character — who they are, how they talk, what they care about:"));
    persona = await ask(red("  character › "));
  }
  const bootMode = ((await ask(red("  boot mode › ") + inkDim("[AUTONOMOUS] "))) || "AUTONOMOUS").toUpperCase();
  close();
  const a = addAgent({ name, role, persona, bootMode });
  log(green(`\n  ✓ flashed ${a.name} (${a.id})`));
  log(inkDim(`  chat now:  `) + redBright(`clawdbios chat ${a.name}`) + "\n");
}

export function deleteCmd(name) {
  if (!name) return log(inkDim("  usage: clawdbios delete <name>"));
  log(removeAgent(name) ? green(`  ✓ removed ${name}`) : redDim(`  no agent named "${name}"`));
}

export async function keyCmd(key) {
  if (!key) {
    const { ask, close } = reader();
    key = await ask(red("  paste your fal.ai key (id:secret) › "));
    close();
  }
  if (!key) return log(inkDim("  cancelled."));
  setConfig({ falKey: key });
  log(green("  ✓ key saved to ~/.clawdbios/config.json"));
}

function spinner(label) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  stdout.write("\x1b[?25l");
  const t = setInterval(() => stdout.write(`\r  ${redBright(frames[i++ % frames.length])} ${inkDim(label)}`), 80);
  return () => { clearInterval(t); stdout.write("\r\x1b[K\x1b[?25h"); };
}

export async function chatCmd(name) {
  if (!getKey()) {
    log(redDim("\n  no fal.ai key set. ") + inkDim("run ") + redBright("clawdbios key") + inkDim(" or export FAL_KEY first.\n"));
    return;
  }
  let agent = name ? findAgent(name) : null;
  const agents = listAgents();
  const { ask, close } = reader();
  if (!agent) {
    if (!agents.length) { close(); log(inkDim("\n  no agents yet — ") + redBright("clawdbios create") + inkDim(" first.\n")); return; }
    log(red("\n  pick an agent:"));
    agents.forEach((a, i) => log(`  ${ember(String(i + 1))} ${redBright(a.name)} ${inkDim("· " + a.role)}`));
    const pick = await ask(red("\n  › "));
    agent = agents[Number(pick) - 1] || findAgent(pick);
    if (!agent) { close(); return log(inkDim("  no such agent.")); }
  }

  log(`\n${renderMiniHeader(agent.name)} ${inkDim("— " + agent.role + " · " + agent.bootMode)}`);
  log(inkDim("  online. chat freely, or use tools:"));
  log(inkDim("  /web <q> · /code <task> · /image <prompt> · /chain <0x…> · /reset · /exit\n"));

  const history = [];
  while (true) {
    const msg = await ask(redBright("  you › "));
    if (msg === "/exit" || msg === "/quit") break;
    if (!msg) continue;
    if (msg === "/reset") { history.length = 0; log(inkDim("  context cleared.\n")); continue; }

    const tm = msg.match(/^\/(web|code|image|chain)\s+([\s\S]+)/);
    if (tm) {
      const [, kind, arg] = tm;
      const stop = spinner(`running ${kind}…`);
      try {
        const r = await runTool(kind, arg.trim());
        stop();
        if (r.type === "image") {
          log(`  ${red(agent.name)} ${ink("›")} ${ember("🎨 image ready:")} ${marble(r.url)}`);
        } else if (r.type === "code") {
          log(`  ${red(agent.name)} ${ink("› code:")}\n${marble(r.text)}`);
        } else {
          log(`  ${red(agent.name)} ${ink("›")} ${marble(r.text)}`);
          if (r.source) log(inkDim("  ↳ " + r.source));
        }
      } catch (e) {
        stop();
        log(redDim(`  ⚠ ${/NO_KEY/.test(e?.message) ? "no fal key" : (e?.message || String(e)).slice(0, 140)}`));
      }
      log("");
      continue;
    }

    history.push({ role: "user", content: msg });
    const stop = spinner(agent.name + " is thinking…");
    let first = true, reply = "";
    try {
      reply = await streamChat(agent, history.slice(0, -1), msg, (chunk) => {
        if (first) { stop(); stdout.write(`  ${red(agent.name)} ${ink("›")} `); first = false; }
        stdout.write(marble(chunk));
      });
    } catch (e) {
      if (first) stop();
      log(redDim(`  ⚠ ${/NO_KEY/.test(e?.message) ? "no fal key" : (e?.message || String(e)).slice(0, 140)}`));
    }
    if (first) stop();
    if (reply) history.push({ role: "agent", content: reply });
    log("\n");
  }
  close();
  log(inkDim("\n  ⌁ session closed. stay bounded.\n"));
}
