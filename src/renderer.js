/**
 * Core renderer — parses .excalidraw JSON and produces an SVG string.
 */

import { getBoundingBox } from "./utils.js";
import { getFontStyleBlock } from "./fonts.js";
import {
  renderRectangle,
  renderEllipse,
  renderDiamond,
  renderLine,
  renderText,
  renderFreedraw,
} from "./shapes.js";

const PADDING = 40;

const RENDERERS = {
  rectangle: renderRectangle,
  ellipse: renderEllipse,
  diamond: renderDiamond,
  line: renderLine,
  arrow: renderLine,
  text: renderText,
  freedraw: renderFreedraw,
};

/**
 * Render an Excalidraw document to an SVG string.
 */
export function renderToSvg(doc, options = {}) {
  const elements = (doc.elements || []).filter((el) => !el.isDeleted);
  const bgColor =
    options.background ??
    doc.appState?.viewBackgroundColor ??
    "#ffffff";

  if (elements.length === 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
  }

  const bbox = getBoundingBox(elements);
  const width = Math.ceil(bbox.width + PADDING * 2);
  const height = Math.ceil(bbox.height + PADDING * 2);
  const offsetX = -bbox.minX + PADDING;
  const offsetY = -bbox.minY + PADDING;

  // Render each element in array order (Excalidraw z-ordering)
  const rendered = [];
  for (const el of elements) {
    const render = RENDERERS[el.type];
    if (!render) continue;

    const svg = render(el);
    if (!svg) continue;

    const opacity = el.opacity != null && el.opacity < 100
      ? ` opacity="${(el.opacity / 100).toFixed(2)}"`
      : "";

    rendered.push(`<g transform="translate(${offsetX.toFixed(2)},${offsetY.toFixed(2)})"${opacity}>\n${svg}\n</g>`);
  }

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    getFontStyleBlock(),
  ];

  if (bgColor && bgColor !== "transparent") {
    parts.push(`<rect width="100%" height="100%" fill="${bgColor}"/>`);
  }

  parts.push(...rendered, "</svg>");

  return parts.filter(Boolean).join("\n");
}
