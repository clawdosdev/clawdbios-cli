import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = join(homedir(), ".clawdbios");
const CONFIG = join(DIR, "config.json");
const AGENTS = join(DIR, "agents.json");

function ensure() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}
function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

export function getConfig() {
  return readJson(CONFIG, { model: "anthropic/claude-sonnet-4.6", temperature: 1 });
}
export function setConfig(patch) {
  ensure();
  const c = { ...getConfig(), ...patch };
  writeFileSync(CONFIG, JSON.stringify(c, null, 2));
  return c;
}

/** Resolve the fal key: env var wins, then stored config. */
export function getKey() {
  return process.env.FAL_KEY || getConfig().falKey || null;
}

export function listAgents() {
  return readJson(AGENTS, []);
}
export function saveAgents(arr) {
  ensure();
  writeFileSync(AGENTS, JSON.stringify(arr, null, 2));
}
export function findAgent(nameOrId) {
  const q = String(nameOrId || "").toLowerCase();
  return listAgents().find((a) => a.id === nameOrId || a.name.toLowerCase() === q);
}
export function addAgent(a) {
  const arr = listAgents();
  const n = arr.length + 1;
  const agent = {
    id: "CLAWD-AGENT-" + String(n).padStart(4, "0"),
    name: a.name,
    role: a.role || "Autonomous Agent",
    persona: a.persona || "You are a helpful autonomous agent running on ClawdBIOS.",
    bootMode: a.bootMode || "AUTONOMOUS",
    createdAt: Date.now(),
  };
  arr.push(agent);
  saveAgents(arr);
  return agent;
}
export function removeAgent(nameOrId) {
  const a = findAgent(nameOrId);
  if (!a) return false;
  saveAgents(listAgents().filter((x) => x.id !== a.id));
  return true;
}
export const CONFIG_DIR = DIR;
