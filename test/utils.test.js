import { describe, test, expect } from "bun:test";
import { opsToPath, escapeXml, drawableToSvg, getBoundingBox } from "../src/utils.js";

describe("opsToPath", () => {
  test("converts move op", () => {
    const ops = [{ op: "move", data: [10, 20] }];
    expect(opsToPath(ops)).toBe("M10.00 20.00");
  });

  test("converts lineTo op", () => {
    const ops = [
      { op: "move", data: [0, 0] },
      { op: "lineTo", data: [100, 50] },
    ];
    expect(opsToPath(ops)).toBe("M0.00 0.00 L100.00 50.00");
  });

  test("converts bcurveTo op", () => {
    const ops = [
      { op: "move", data: [0, 0] },
      { op: "bcurveTo", data: [10, 20, 30, 40, 50, 60] },
    ];
    expect(opsToPath(ops)).toBe("M0.00 0.00 C10.00 20.00,30.00 40.00,50.00 60.00");
  });

  test("handles empty ops", () => {
    expect(opsToPath([])).toBe("");
  });
});

describe("escapeXml", () => {
  test("escapes ampersand", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  test("escapes angle brackets", () => {
    expect(escapeXml("<div>")).toBe("&lt;div&gt;");
  });

  test("escapes quotes", () => {
    expect(escapeXml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  test("passes through clean text", () => {
    expect(escapeXml("Hello World")).toBe("Hello World");
  });
});

describe("drawableToSvg", () => {
  test("renders path set", () => {
    const drawable = {
      options: { stroke: "#000", strokeWidth: 2 },
      sets: [{ type: "path", ops: [{ op: "move", data: [0, 0] }, { op: "lineTo", data: [10, 10] }] }],
    };
    const svg = drawableToSvg(drawable);
    expect(svg).toContain("<path");
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('fill="none"');
  });

  test("renders fillPath set", () => {
    const drawable = {
      options: { stroke: "#000", strokeWidth: 2, fill: "#ff0000" },
      sets: [{ type: "fillPath", ops: [{ op: "move", data: [0, 0] }, { op: "lineTo", data: [10, 10] }] }],
    };
    const svg = drawableToSvg(drawable);
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('stroke="none"');
  });

  test("renders fillSketch set", () => {
    const drawable = {
      options: { stroke: "#000", strokeWidth: 2, fill: "#ff0000" },
      sets: [{ type: "fillSketch", ops: [{ op: "move", data: [0, 0] }, { op: "lineTo", data: [10, 10] }] }],
    };
    const svg = drawableToSvg(drawable);
    expect(svg).toContain('stroke="#ff0000"');
  });

  test("handles empty sets", () => {
    const drawable = { options: { stroke: "#000", strokeWidth: 2 }, sets: [] };
    expect(drawableToSvg(drawable)).toBe("");
  });
});

describe("getBoundingBox", () => {
  test("computes box for single element", () => {
    const elements = [{ x: 100, y: 200, width: 50, height: 30 }];
    const box = getBoundingBox(elements);
    expect(box.minX).toBe(100);
    expect(box.minY).toBe(200);
    expect(box.maxX).toBe(150);
    expect(box.maxY).toBe(230);
    expect(box.width).toBe(50);
    expect(box.height).toBe(30);
  });

  test("computes box for multiple elements", () => {
    const elements = [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 200, y: 100, width: 80, height: 40 },
    ];
    const box = getBoundingBox(elements);
    expect(box.minX).toBe(0);
    expect(box.minY).toBe(0);
    expect(box.maxX).toBe(280);
    expect(box.maxY).toBe(140);
  });

  test("handles point-based elements (lines/arrows)", () => {
    const elements = [{ x: 50, y: 50, points: [[0, 0], [100, 80]] }];
    const box = getBoundingBox(elements);
    expect(box.minX).toBe(50);
    expect(box.minY).toBe(50);
    expect(box.maxX).toBe(150);
    expect(box.maxY).toBe(130);
  });

  test("skips deleted elements", () => {
    const elements = [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 500, y: 500, width: 100, height: 50, isDeleted: true },
    ];
    const box = getBoundingBox(elements);
    expect(box.maxX).toBe(100);
    expect(box.maxY).toBe(50);
  });

  test("expands box for rotated elements", () => {
    // A 200x80 rect rotated 45 degrees — height should expand well beyond 80
    const elements = [
      { x: 100, y: 100, width: 200, height: 80, angle: Math.PI / 4 },
    ];
    const box = getBoundingBox(elements);
    expect(box.height).toBeGreaterThan(150);
    // Width contracts slightly at 45deg for a wide rect, but both dimensions
    // should differ from unrotated (200x80)
    expect(box.width).not.toBe(200);
    expect(box.height).not.toBe(80);
  });

  test("unrotated element has exact bounds", () => {
    const elements = [{ x: 100, y: 100, width: 200, height: 80, angle: 0 }];
    const box = getBoundingBox(elements);
    expect(box.width).toBe(200);
    expect(box.height).toBe(80);
  });
});
