import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { renderToSvg } from "../src/renderer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(resolve(__dirname, "fixtures", name), "utf-8"));

describe("renderToSvg", () => {
  test("renders simple diagram", () => {
    const doc = fixture("simple.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toStartWith("<svg");
    expect(svg).toEndWith("</svg>");
    expect(svg).toContain("Hello");
    expect(svg).toContain("xmlns");
  });

  test("renders all shape types", () => {
    const doc = fixture("all-shapes.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain("<path"); // shapes
    expect(svg).toContain("<text");  // text
    expect(svg).toContain("Standalone text");
  });

  test("renders rotated elements", () => {
    const doc = fixture("rotated.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain("rotate(");
  });

  test("renders empty document", () => {
    const doc = fixture("empty.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="100"');
  });

  test("renders different fill/stroke styles", () => {
    const doc = fixture("styles.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain("<path");
    // Clean rect with roundness
    expect(svg).toContain("<rect");
  });

  test("includes font style block", () => {
    const doc = fixture("simple.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain("@font-face");
    expect(svg).toContain("Virgil");
  });

  test("includes white background by default", () => {
    const doc = fixture("simple.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain('fill="#ffffff"');
  });

  test("respects transparent background option", () => {
    const doc = fixture("simple.excalidraw");
    const svg = renderToSvg(doc, { background: "transparent" });
    expect(svg).not.toContain('fill="#ffffff"');
  });

  test("respects custom background color", () => {
    const doc = fixture("simple.excalidraw");
    const svg = renderToSvg(doc, { background: "#f0f0f0" });
    expect(svg).toContain('fill="#f0f0f0"');
  });

  test("handles opacity", () => {
    const doc = fixture("styles.excalidraw");
    const svg = renderToSvg(doc);
    expect(svg).toContain('opacity="0.50"');
  });

  test("skips deleted elements", () => {
    const doc = {
      type: "excalidraw",
      version: 2,
      elements: [
        { type: "rectangle", id: "visible", x: 0, y: 0, width: 100, height: 50, seed: 1, roughness: 1, strokeWidth: 2, strokeColor: "#000", backgroundColor: "transparent", fillStyle: "solid", strokeStyle: "solid", isDeleted: false },
        { type: "rectangle", id: "deleted", x: 200, y: 200, width: 100, height: 50, seed: 2, roughness: 1, strokeWidth: 2, strokeColor: "#f00", backgroundColor: "transparent", fillStyle: "solid", strokeStyle: "solid", isDeleted: true },
      ],
      appState: {},
      files: {},
    };
    const svg = renderToSvg(doc);
    // Bounding box should only cover the visible element (0-100 x, 0-50 y + padding)
    const widthMatch = svg.match(/width="(\d+)"/);
    expect(Number(widthMatch[1])).toBeLessThan(200);
  });

  test("produces valid SVG dimensions", () => {
    const doc = fixture("all-shapes.excalidraw");
    const svg = renderToSvg(doc);
    const widthMatch = svg.match(/width="(\d+)"/);
    const heightMatch = svg.match(/height="(\d+)"/);
    expect(Number(widthMatch[1])).toBeGreaterThan(0);
    expect(Number(heightMatch[1])).toBeGreaterThan(0);
  });
});
