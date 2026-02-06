import { describe, test, expect, afterAll } from "bun:test";
import { existsSync, unlinkSync, statSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exportDiagram, renderToSvg } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, "fixtures", "simple.excalidraw");
const ALL_SHAPES = resolve(__dirname, "fixtures", "all-shapes.excalidraw");
const TMP_PNG = resolve(__dirname, "..", ".test-export.png");
const TMP_SVG = resolve(__dirname, "..", ".test-export.svg");

afterAll(() => {
  for (const f of [TMP_PNG, TMP_SVG]) {
    if (existsSync(f)) unlinkSync(f);
  }
});

describe("exportDiagram", () => {
  test("exports PNG with correct metadata", () => {
    const result = exportDiagram(FIXTURE, TMP_PNG, { format: "png", scale: 2 });
    expect(result.format).toBe("png");
    expect(result.path).toBe(TMP_PNG);
    expect(result.size).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(existsSync(TMP_PNG)).toBe(true);
  });

  test("PNG file has valid header", () => {
    exportDiagram(FIXTURE, TMP_PNG, { format: "png" });
    const buf = readFileSync(TMP_PNG);
    // PNG magic bytes: 137 80 78 71
    expect(buf[0]).toBe(137);
    expect(buf[1]).toBe(80);
    expect(buf[2]).toBe(78);
    expect(buf[3]).toBe(71);
  });

  test("exports SVG with correct metadata", () => {
    const result = exportDiagram(FIXTURE, TMP_SVG, { format: "svg" });
    expect(result.format).toBe("svg");
    expect(result.path).toBe(TMP_SVG);
    expect(result.size).toBeGreaterThan(0);
    expect(existsSync(TMP_SVG)).toBe(true);
  });

  test("SVG file contains valid SVG", () => {
    exportDiagram(FIXTURE, TMP_SVG, { format: "svg" });
    const content = readFileSync(TMP_SVG, "utf-8");
    expect(content).toStartWith("<svg");
    expect(content).toEndWith("</svg>");
  });

  test("exports all-shapes fixture without error", () => {
    const result = exportDiagram(ALL_SHAPES, TMP_PNG, { format: "png" });
    expect(result.format).toBe("png");
    expect(result.size).toBeGreaterThan(0);
  });

  test("higher scale produces larger file", () => {
    const r1 = exportDiagram(FIXTURE, TMP_PNG, { format: "png", scale: 1 });
    const r3 = exportDiagram(FIXTURE, TMP_PNG, { format: "png", scale: 3 });
    expect(r3.width).toBeGreaterThan(r1.width);
    expect(r3.height).toBeGreaterThan(r1.height);
  });

  test("auto-detects format from output path", () => {
    const result = exportDiagram(FIXTURE, TMP_SVG);
    expect(result.format).toBe("svg");
  });
});

describe("renderToSvg (API export)", () => {
  test("is exported and callable", () => {
    expect(typeof renderToSvg).toBe("function");
    const doc = JSON.parse(readFileSync(FIXTURE, "utf-8"));
    const svg = renderToSvg(doc);
    expect(svg).toContain("<svg");
  });
});
