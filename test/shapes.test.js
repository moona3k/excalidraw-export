import { describe, test, expect } from "bun:test";
import {
  renderRectangle,
  renderEllipse,
  renderDiamond,
  renderLine,
  renderText,
  renderFreedraw,
  renderImage,
  renderFrame,
} from "../src/shapes.js";

const baseEl = {
  seed: 42,
  roughness: 1,
  strokeWidth: 2,
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeStyle: "solid",
  opacity: 100,
  angle: 0,
};

describe("renderRectangle", () => {
  test("produces SVG with path elements", () => {
    const el = { ...baseEl, type: "rectangle", x: 10, y: 20, width: 100, height: 50 };
    const svg = renderRectangle(el);
    expect(svg).toContain("<path");
    expect(svg).toContain('stroke="#1e1e1e"');
  });

  test("renders clean rounded rect when roughness is 0", () => {
    const el = {
      ...baseEl, type: "rectangle", x: 10, y: 20, width: 100, height: 50,
      roughness: 0, roundness: { type: 3 }, backgroundColor: "#a5d8ff",
    };
    const svg = renderRectangle(el);
    expect(svg).toContain("<rect");
    expect(svg).toContain("rx=");
    expect(svg).toContain('#a5d8ff');
  });

  test("renders filled rectangle", () => {
    const el = { ...baseEl, type: "rectangle", x: 0, y: 0, width: 80, height: 40, backgroundColor: "#ff0000" };
    const svg = renderRectangle(el);
    expect(svg).toBeTruthy();
    expect(svg.length).toBeGreaterThan(0);
  });

  test("handles dashed stroke", () => {
    const el = {
      ...baseEl, type: "rectangle", x: 0, y: 0, width: 80, height: 40,
      roughness: 0, roundness: { type: 3 }, strokeStyle: "dashed",
    };
    const svg = renderRectangle(el);
    expect(svg).toContain("stroke-dasharray");
  });
});

describe("renderEllipse", () => {
  test("produces SVG path", () => {
    const el = { ...baseEl, type: "ellipse", x: 50, y: 50, width: 100, height: 60 };
    const svg = renderEllipse(el);
    expect(svg).toContain("<path");
  });
});

describe("renderDiamond", () => {
  test("produces SVG path", () => {
    const el = { ...baseEl, type: "diamond", x: 50, y: 50, width: 80, height: 80 };
    const svg = renderDiamond(el);
    expect(svg).toContain("<path");
  });
});

describe("renderLine", () => {
  test("renders straight line", () => {
    const el = { ...baseEl, type: "line", x: 0, y: 0, points: [[0, 0], [100, 0]] };
    const svg = renderLine(el);
    expect(svg).toContain("<path");
  });

  test("renders arrow with arrowhead", () => {
    const el = {
      ...baseEl, type: "arrow", x: 0, y: 0,
      points: [[0, 0], [100, 0]],
      endArrowhead: "arrow",
    };
    const svg = renderLine(el);
    expect(svg).toContain("<path");
    // Should have multiple path elements (line + arrowhead)
    const pathCount = (svg.match(/<path/g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(2);
  });

  test("renders bidirectional arrow", () => {
    const el = {
      ...baseEl, type: "arrow", x: 0, y: 0,
      points: [[0, 0], [100, 0]],
      startArrowhead: "arrow",
      endArrowhead: "arrow",
    };
    const svg = renderLine(el);
    const pathCount = (svg.match(/<path/g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(3);
  });

  test("renders multi-point path", () => {
    const el = { ...baseEl, type: "line", x: 0, y: 0, points: [[0, 0], [50, 50], [100, 0]] };
    const svg = renderLine(el);
    expect(svg).toContain("<path");
  });

  test("renders curved path when roundness is set", () => {
    const el = {
      ...baseEl, type: "line", x: 0, y: 0,
      points: [[0, 0], [50, 50], [100, 0]],
      roundness: { type: 2 },
    };
    const svg = renderLine(el);
    expect(svg).toContain("<path");
    // Curved paths should contain bezier curve commands
    expect(svg).toContain("C");
  });

  test("returns empty for insufficient points", () => {
    const el = { ...baseEl, type: "line", x: 0, y: 0, points: [[0, 0]] };
    expect(renderLine(el)).toBe("");
  });

  test("returns empty for no points", () => {
    const el = { ...baseEl, type: "line", x: 0, y: 0 };
    expect(renderLine(el)).toBe("");
  });
});

describe("renderText", () => {
  test("renders text element", () => {
    const el = {
      ...baseEl, type: "text", x: 10, y: 20, width: 100, height: 24,
      text: "Hello", fontSize: 20, fontFamily: 1,
      textAlign: "left", verticalAlign: "top",
    };
    const svg = renderText(el);
    expect(svg).toContain("<text");
    expect(svg).toContain("Hello");
    expect(svg).toContain("Virgil");
  });

  test("handles center alignment", () => {
    const el = {
      ...baseEl, type: "text", x: 10, y: 20, width: 100, height: 24,
      text: "Centered", fontSize: 20, fontFamily: 1,
      textAlign: "center", verticalAlign: "middle",
    };
    const svg = renderText(el);
    expect(svg).toContain('text-anchor="middle"');
  });

  test("handles multi-line text", () => {
    const el = {
      ...baseEl, type: "text", x: 10, y: 20, width: 100, height: 48,
      text: "Line 1\nLine 2", fontSize: 20, fontFamily: 1,
      textAlign: "left", verticalAlign: "top",
    };
    const svg = renderText(el);
    const tspanCount = (svg.match(/<tspan/g) || []).length;
    expect(tspanCount).toBe(2);
  });

  test("uses monospace font for fontFamily 3", () => {
    const el = {
      ...baseEl, type: "text", x: 10, y: 20, width: 100, height: 24,
      text: "code", fontSize: 16, fontFamily: 3,
      textAlign: "left", verticalAlign: "top",
    };
    const svg = renderText(el);
    expect(svg).toContain("Cascadia");
  });

  test("escapes special characters", () => {
    const el = {
      ...baseEl, type: "text", x: 10, y: 20, width: 100, height: 24,
      text: "A < B & C", fontSize: 20, fontFamily: 1,
      textAlign: "left", verticalAlign: "top",
    };
    const svg = renderText(el);
    expect(svg).toContain("&lt;");
    expect(svg).toContain("&amp;");
  });
});

describe("renderFreedraw", () => {
  test("renders polyline path", () => {
    const el = {
      ...baseEl, type: "freedraw", x: 10, y: 10,
      points: [[0, 0], [5, 10], [15, 20]],
    };
    const svg = renderFreedraw(el);
    expect(svg).toContain("<path");
    expect(svg).toContain("M");
    expect(svg).toContain("L");
  });

  test("returns empty for insufficient points", () => {
    const el = { ...baseEl, type: "freedraw", x: 0, y: 0, points: [[0, 0]] };
    expect(renderFreedraw(el)).toBe("");
  });
});

describe("renderImage", () => {
  test("renders image with data URL", () => {
    const el = { ...baseEl, type: "image", x: 10, y: 20, width: 200, height: 150, fileId: "img1" };
    const files = { img1: { dataURL: "data:image/png;base64,abc123", mimeType: "image/png" } };
    const svg = renderImage(el, files);
    expect(svg).toContain("<image");
    expect(svg).toContain("data:image/png;base64,abc123");
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="150"');
  });

  test("returns empty when file not found", () => {
    const el = { ...baseEl, type: "image", x: 10, y: 20, width: 200, height: 150, fileId: "missing" };
    expect(renderImage(el, {})).toBe("");
  });

  test("returns empty when no files object", () => {
    const el = { ...baseEl, type: "image", x: 10, y: 20, width: 200, height: 150, fileId: "img1" };
    expect(renderImage(el, null)).toBe("");
  });
});

describe("renderFrame", () => {
  test("renders dashed rectangle", () => {
    const el = { ...baseEl, type: "frame", x: 10, y: 20, width: 400, height: 300, name: "My Frame" };
    const svg = renderFrame(el);
    expect(svg).toContain("<rect");
    expect(svg).toContain("stroke-dasharray");
    expect(svg).toContain("My Frame");
  });

  test("renders without label when name is missing", () => {
    const el = { ...baseEl, type: "frame", x: 10, y: 20, width: 400, height: 300 };
    const svg = renderFrame(el);
    expect(svg).toContain("<rect");
    expect(svg).not.toContain("<text");
  });
});
