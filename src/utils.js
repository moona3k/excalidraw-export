/**
 * SVG string utilities and path conversion.
 * No DOM — everything is string-based.
 */

/**
 * Convert roughjs ops to SVG path `d` attribute string.
 */
export function opsToPath(ops, precision = 2) {
  let path = "";
  for (const item of ops) {
    const d = item.data.map((v) => v.toFixed(precision));
    switch (item.op) {
      case "move":
        path += `M${d[0]} ${d[1]} `;
        break;
      case "bcurveTo":
        path += `C${d[0]} ${d[1]},${d[2]} ${d[3]},${d[4]} ${d[5]} `;
        break;
      case "lineTo":
        path += `L${d[0]} ${d[1]} `;
        break;
    }
  }
  return path.trim();
}

/**
 * Escape text for SVG XML.
 */
export function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert a roughjs Drawable to SVG path elements.
 */
export function drawableToSvg(drawable) {
  const parts = [];
  const o = drawable.options;

  for (const set of drawable.sets || []) {
    const d = opsToPath(set.ops);
    switch (set.type) {
      case "path":
        parts.push(
          `<path d="${d}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        );
        break;
      case "fillPath":
        parts.push(
          `<path d="${d}" stroke="none" fill="${o.fill || "none"}"/>`
        );
        break;
      case "fillSketch":
        parts.push(
          `<path d="${d}" stroke="${o.fill || o.stroke}" stroke-width="${o.fillWeight || o.strokeWidth / 2}" fill="none" stroke-linecap="round"/>`
        );
        break;
    }
  }
  return parts.join("\n");
}

/**
 * Compute bounding box across all visible elements.
 */
export function getBoundingBox(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.isDeleted) continue;

    if (el.points && el.points.length > 0) {
      for (const [px, py] of el.points) {
        minX = Math.min(minX, el.x + px);
        minY = Math.min(minY, el.y + py);
        maxX = Math.max(maxX, el.x + px);
        maxY = Math.max(maxY, el.y + py);
      }
    } else {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 0));
      maxY = Math.max(maxY, el.y + (el.height || 0));
    }
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
