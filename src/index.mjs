#!/usr/bin/env node
import { showBanner, listCmd, createCmd, deleteCmd, chatCmd, keyCmd } from "./commands.mjs";
import { red, redBright, ember, ink, inkDim, marble, dim } from "./theme.mjs";

const [cmd, ...rest] = process.argv.slice(2);

function help() {
  showBanner();
  const row = (c, d) => console.log(`  ${redBright(c.padEnd(22))} ${inkDim(d)}`);
  console.log(ink("  COMMANDS\n"));
  row("clawdbios create", "flash a new agent (name + character)");
  row("clawdbios chat [name]", "chat in character — tools: /web /code /image /chain");
  row("clawdbios list", "list deployed agents");
  row("clawdbios delete <name>", "remove an agent");
  row("clawdbios key [id:secret]", "set your fal.ai key");
  console.log("");
  console.log(inkDim("  model · ") + marble("Claude Fable 5") + inkDim("  via fal.ai"));
  console.log(inkDim("  agents & key live in ~/.clawdbios/\n"));
}

const run = {
  create: () => createCmd(),
  new: () => createCmd(),
  chat: () => chatCmd(rest[0]),
  talk: () => chatCmd(rest[0]),
  list: () => { showBanner(); listCmd(); },
  ls: () => { showBanner(); listCmd(); },
  delete: () => deleteCmd(rest[0]),
  rm: () => deleteCmd(rest[0]),
  key: () => keyCmd(rest[0]),
  help: help,
  "--help": help,
  "-h": help,
};

(run[cmd] || help)();
