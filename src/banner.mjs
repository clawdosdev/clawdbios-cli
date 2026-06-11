import { biosGradient, red, redBright, redDim, ink, inkDim, green, dim, ember } from "./theme.mjs";

/* ANSI-Shadow block glyphs, assembled at runtime so rows always align. */
const G = {
  C: [" ██████╗", "██╔════╝", "██║     ", "██║     ", "╚██████╗", " ╚═════╝"],
  L: ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  W: ["██╗    ██╗", "██║    ██║", "██║ █╗ ██║", "██║███╗██║", "╚███╔███╔╝", " ╚══╝╚══╝ "],
  D: ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
  B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
  I: ["██╗", "██║", "██║", "██║", "██║", "╚═╝"],
  O: [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  S: ["███████╗", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚══════╝"],
};

function word(str, gap = 1) {
  const rows = ["", "", "", "", "", ""];
  const sep = " ".repeat(gap);
  [...str].forEach((ch, idx) => {
    const g = G[ch];
    for (let r = 0; r < 6; r++) rows[r] += (idx ? sep : "") + g[r];
  });
  return rows.join("\n");
}

/* Compact front-facing lobster — claws up, segmented tail. */
const LOBSTER = [
  "     (\\/)          (\\/)",
  "      \\_\\    /\\    /_/",
  "        \\_\\__|  |__/_/",
  "          \\( o    o )/",
  "        ___ \\  ..  / ___",
  "       /   \\_\\    /_/   \\",
  "       \\____ )\\||/( ____/",
  "            \\_\\||/_/",
  "              (||)",
  "              /||\\",
  "             (_||_)",
  "               \\/",
].join("\n");

export function renderLobster() {
  return biosGradient(LOBSTER);
}

/* "CLAWD" over "BIOS" with the lobster — the full firmware splash. */
export function renderBanner() {
  const w = 52;
  const sep = inkDim("─".repeat(w));
  const logo = biosGradient(word("CLAWD") + "\n\n" + word("BIOS"));

  const tag = redDim("  the firmware layer for autonomous agents");
  const sub = inkDim("  boot · verify · execute — in your terminal");
  const ver = `  ${ink("firmware ·")} ${red("v0.1.0")}   ${ink("status ·")} ${green("ALL SYSTEMS READY")}`;

  return `${renderLobster()}\n\n${logo}\n\n${tag}\n${sub}\n\n${sep}\n${ver}\n${sep}\n`;
}

export function renderMiniHeader(name) {
  const who = name ? redBright(name) : dim("no agent");
  return `${ember("⌁")} ${redDim("clawdbios")} ${ink("·")} ${who}`;
}
