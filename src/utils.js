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
 * Rotate a point around a center by angle (radians).
 */
function rotatePoint(x, y, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/**
 * Get the 4 corners of an element's bounding box, rotated if needed.
 */
function getElementCorners(el) {
  let corners;

  if (el.points && el.points.length > 0) {
    // For lines/arrows, compute tight bounds from points
    let pMinX = Infinity, pMinY = Infinity, pMaxX = -Infinity, pMaxY = -Infinity;
    for (const [px, py] of el.points) {
      pMinX = Math.min(pMinX, el.x + px);
      pMinY = Math.min(pMinY, el.y + py);
      pMaxX = Math.max(pMaxX, el.x + px);
      pMaxY = Math.max(pMaxY, el.y + py);
    }
    corners = [
      [pMinX, pMinY], [pMaxX, pMinY],
      [pMaxX, pMaxY], [pMinX, pMaxY],
    ];
  } else {
    const x2 = el.x + (el.width || 0);
    const y2 = el.y + (el.height || 0);
    corners = [
      [el.x, el.y], [x2, el.y],
      [x2, y2], [el.x, y2],
    ];
  }

  // Apply rotation if present
  if (el.angle && el.angle !== 0) {
    const cx = el.x + (el.width || 0) / 2;
    const cy = el.y + (el.height || 0) / 2;
    corners = corners.map(([x, y]) => rotatePoint(x, y, cx, cy, el.angle));
  }

  return corners;
}

/**
 * Compute bounding box across all visible elements, accounting for rotation.
 */
export function getBoundingBox(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.isDeleted) continue;

    for (const [x, y] of getElementCorners(el)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
