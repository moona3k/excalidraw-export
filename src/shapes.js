/**
 * Shape rendering — converts Excalidraw elements to SVG strings.
 * Uses roughjs generator (no DOM) for hand-drawn effects.
 */

import rough from "roughjs";
import { drawableToSvg, escapeXml } from "./utils.js";
import { FONT_FAMILIES } from "./fonts.js";

const gen = rough.generator();

/**
 * Build roughjs options from an Excalidraw element.
 */
function roughOpts(el) {
  const opts = {
    seed: el.seed || 1,
    roughness: el.roughness ?? 1,
    strokeWidth: el.strokeWidth || 2,
    stroke: el.strokeColor || "#1e1e1e",
    bowing: el.roughness > 0 ? 1 : 0,
  };

  if (el.strokeStyle === "dashed") opts.strokeLineDash = [12, 8];
  if (el.strokeStyle === "dotted") opts.strokeLineDash = [3, 6];

  if (el.backgroundColor && el.backgroundColor !== "transparent") {
    opts.fill = el.backgroundColor;
    opts.fillStyle = el.fillStyle || "solid";
  }

  return opts;
}

/**
 * SVG stroke-dasharray attribute string.
 */
function dashAttr(el) {
  if (el.strokeStyle === "dashed") return ' stroke-dasharray="12 8"';
  if (el.strokeStyle === "dotted") return ' stroke-dasharray="3 6"';
  return "";
}

// ── Rectangles ─────────────────────────────────────────────

export function renderRectangle(el) {
  const opts = roughOpts(el);

  // Clean rounded rect: skip roughjs, use native SVG
  if (el.roundness && el.roughness === 0) {
    const r = Math.min(el.width, el.height) * 0.25;
    const fill =
      el.backgroundColor && el.backgroundColor !== "transparent"
        ? el.backgroundColor
        : "none";
    const parts = [];
    if (fill !== "none") {
      parts.push(
        `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${r}" fill="${fill}" stroke="none"/>`
      );
    }
    parts.push(
      `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${r}" fill="none" stroke="${el.strokeColor || "#1e1e1e"}" stroke-width="${el.strokeWidth || 2}"${dashAttr(el)}/>`
    );
    return parts.join("\n");
  }

  return drawableToSvg(gen.rectangle(el.x, el.y, el.width, el.height, opts));
}

// ── Ellipses ───────────────────────────────────────────────

export function renderEllipse(el) {
  const opts = roughOpts(el);
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  return drawableToSvg(gen.ellipse(cx, cy, el.width, el.height, opts));
}

// ── Diamonds ───────────────────────────────────────────────

export function renderDiamond(el) {
  const opts = roughOpts(el);
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const points = [
    [cx, el.y],
    [el.x + el.width, cy],
    [cx, el.y + el.height],
    [el.x, cy],
  ];
  return drawableToSvg(gen.polygon(points, opts));
}

// ── Lines & Arrows ─────────────────────────────────────────

export function renderLine(el) {
  if (!el.points || el.points.length < 2) return "";

  const opts = roughOpts(el);
  const abs = el.points.map(([px, py]) => [el.x + px, el.y + py]);
  const parts = [];

  // Draw the line
  if (abs.length === 2) {
    parts.push(drawableToSvg(gen.line(abs[0][0], abs[0][1], abs[1][0], abs[1][1], opts)));
  } else {
    parts.push(drawableToSvg(gen.linearPath(abs, opts)));
  }

  // Arrowheads
  if (el.type === "arrow") {
    if (el.endArrowhead === "arrow") {
      parts.push(arrowhead(abs[abs.length - 2], abs[abs.length - 1], el));
    }
    if (el.startArrowhead === "arrow") {
      parts.push(arrowhead(abs[1], abs[0], el));
    }
  }

  return parts.join("\n");
}

function arrowhead(from, to, el) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const len = Math.max(15, (el.strokeWidth || 2) * 6);
  const spread = Math.PI / 6;

  const x1 = to[0] - len * Math.cos(angle - spread);
  const y1 = to[1] - len * Math.sin(angle - spread);
  const x2 = to[0] - len * Math.cos(angle + spread);
  const y2 = to[1] - len * Math.sin(angle + spread);

  if (el.roughness === 0) {
    return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} L${to[0].toFixed(2)} ${to[1].toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${el.strokeColor || "#1e1e1e"}" stroke-width="${el.strokeWidth || 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const seed = (el.seed || 1) + 100;
  const o = { seed, roughness: el.roughness ?? 1, strokeWidth: el.strokeWidth || 2, stroke: el.strokeColor || "#1e1e1e" };
  return [
    drawableToSvg(gen.line(x1, y1, to[0], to[1], o)),
    drawableToSvg(gen.line(to[0], to[1], x2, y2, o)),
  ].join("\n");
}

// ── Text ───────────────────────────────────────────────────

export function renderText(el) {
  const fontFamily = FONT_FAMILIES[el.fontFamily] || FONT_FAMILIES[1];
  const fontSize = el.fontSize || 20;
  const color = el.strokeColor || "#1e1e1e";
  const lines = (el.text || el.originalText || "").split("\n");
  const lineHeight = fontSize * 1.25;

  // Horizontal alignment
  let anchor = "start";
  let dx = 0;
  if (el.textAlign === "center") {
    anchor = "middle";
    dx = (el.width || 0) / 2;
  } else if (el.textAlign === "right") {
    anchor = "end";
    dx = el.width || 0;
  }

  // Vertical start position
  let startY = el.y + fontSize;
  if (el.verticalAlign === "middle" && el.height) {
    const totalH = lines.length * lineHeight;
    startY = el.y + (el.height - totalH) / 2 + fontSize;
  }

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${(el.x + dx).toFixed(2)}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<text x="${(el.x + dx).toFixed(2)}" y="${startY.toFixed(2)}" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}" text-anchor="${anchor}">${tspans}</text>`;
}

// ── Freedraw ───────────────────────────────────────────────

export function renderFreedraw(el) {
  if (!el.points || el.points.length < 2) return "";

  const abs = el.points.map(([px, py]) => [el.x + px, el.y + py]);
  const d = "M" + abs.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L");

  return `<path d="${d}" stroke="${el.strokeColor || "#1e1e1e"}" stroke-width="${el.strokeWidth || 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}
