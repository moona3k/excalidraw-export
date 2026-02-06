/**
 * Font handling — embeds Virgil font as base64 in SVG.
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "..", "fonts");

let virgilBase64 = null;

function getVirgilBase64() {
  if (virgilBase64) return virgilBase64;
  try {
    const buf = readFileSync(join(FONTS_DIR, "Virgil-Regular.woff2"));
    virgilBase64 = buf.toString("base64");
  } catch {
    virgilBase64 = "";
  }
  return virgilBase64;
}

/**
 * Generate SVG <style> block with embedded fonts.
 */
export function getFontStyleBlock() {
  const virgil = getVirgilBase64();
  if (!virgil) return "";

  return `<defs><style>
@font-face {
  font-family: 'Virgil';
  src: url('data:font/woff2;base64,${virgil}') format('woff2');
  font-weight: normal;
  font-style: normal;
}
</style></defs>`;
}

// Excalidraw font family mapping
export const FONT_FAMILIES = {
  1: "Virgil, Segoe UI Emoji, cursive",
  2: "Helvetica, Arial, sans-serif",
  3: "Cascadia, Fira Code, monospace",
};
