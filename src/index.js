/**
 * excalidraw-export — Export Excalidraw diagrams to PNG and SVG.
 *
 * Pure computation: roughjs for hand-drawn effects, resvg for PNG.
 * No browser, no DOM, no Playwright.
 */

import { readFileSync, writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";
import { renderToSvg } from "./renderer.js";

/**
 * Export an Excalidraw file to PNG or SVG.
 */
export function exportDiagram(inputPath, outputPath, options = {}) {
  const raw = readFileSync(inputPath, "utf-8");
  const doc = JSON.parse(raw);
  const format = options.format || (outputPath.endsWith(".svg") ? "svg" : "png");

  const svg = renderToSvg(doc, { background: options.background });

  if (format === "svg") {
    writeFileSync(outputPath, svg);
    return { format: "svg", path: outputPath, size: svg.length };
  }

  const scale = options.scale || 2;
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    font: { loadSystemFonts: true },
  });

  const rendered = resvg.render();
  const png = rendered.asPng();
  writeFileSync(outputPath, png);

  return {
    format: "png",
    path: outputPath,
    size: png.length,
    width: rendered.width,
    height: rendered.height,
  };
}

export { renderToSvg };
