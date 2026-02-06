import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import { existsSync, unlinkSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "..", "src", "cli.js");
const FIXTURE = resolve(__dirname, "fixtures", "simple.excalidraw");
const TMP_PNG = resolve(__dirname, "..", ".test-output.png");
const TMP_SVG = resolve(__dirname, "..", ".test-output.svg");

function run(args) {
  return execSync(`node ${CLI} ${args}`, { encoding: "utf-8", timeout: 30000 }).trim();
}

afterAll(() => {
  // Clean up test outputs
  for (const f of [TMP_PNG, TMP_SVG]) {
    if (existsSync(f)) unlinkSync(f);
  }
});

describe("CLI", () => {
  test("--version prints version", () => {
    const output = run("--version");
    expect(output).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("--help prints usage", () => {
    const output = run("--help");
    expect(output).toContain("excalidraw-export");
    expect(output).toContain("Usage:");
    expect(output).toContain("Options:");
  });

  test("no args prints usage and exits with error", () => {
    try {
      run("");
      expect(false).toBe(true); // should not reach
    } catch (err) {
      expect(err.status).toBe(1);
    }
  });

  test("missing file exits with error", () => {
    try {
      run("nonexistent.excalidraw");
      expect(false).toBe(true);
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr.toString()).toContain("not found");
    }
  });

  test("unknown option exits with error", () => {
    try {
      run("--bogus");
      expect(false).toBe(true);
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr.toString()).toContain("Unknown option");
    }
  });

  test("exports PNG", () => {
    const output = run(`${FIXTURE} -o ${TMP_PNG}`);
    expect(output).toContain("✓");
    expect(output).toContain(".png");
    expect(output).toMatch(/\d+×\d+/); // dimensions
    expect(existsSync(TMP_PNG)).toBe(true);
    expect(statSync(TMP_PNG).size).toBeGreaterThan(1000);
  });

  test("exports SVG", () => {
    const output = run(`${FIXTURE} --svg -o ${TMP_SVG}`);
    expect(output).toContain("✓");
    expect(output).toContain(".svg");
    expect(existsSync(TMP_SVG)).toBe(true);
    expect(statSync(TMP_SVG).size).toBeGreaterThan(100);
  });

  test("custom scale produces larger PNG", () => {
    const output1x = run(`${FIXTURE} --scale 1 -o ${TMP_PNG}`);
    const size1x = statSync(TMP_PNG).size;

    const output3x = run(`${FIXTURE} --scale 3 -o ${TMP_PNG}`);
    const size3x = statSync(TMP_PNG).size;

    expect(size3x).toBeGreaterThan(size1x);
  });
});
