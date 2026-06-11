import chalk from "chalk";

// ClawdBIOS palette — red CRT firmware on deep void.
// Brand: "the firmware layer for autonomous agents."
export const red       = chalk.hex("#e23b32");
export const redBright = chalk.hex("#ff4a3d");
export const redDim    = chalk.hex("#b8443c");
export const ember     = chalk.hex("#ff6b35");
export const ink       = chalk.hex("#9a4a44");
export const inkDim    = chalk.hex("#6b322e");
export const green     = chalk.hex("#43c46a");
export const marble    = chalk.hex("#d98a83");
export const dim       = chalk.dim;
export const bold      = chalk.bold;

/** Top-to-bottom red glow gradient for the banner. */
export function biosGradient(text) {
  const shades = ["#ff6b4a", "#ff4a3d", "#ef3b30", "#e23b32", "#c43029", "#a82822"];
  return text
    .split("\n")
    .map((line, i) => chalk.hex(shades[Math.min(i, shades.length - 1)])(line))
    .join("\n");
}
