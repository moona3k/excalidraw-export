#!/usr/bin/env node

/**
 * excalidraw-export CLI
 *
 * Usage:
 *   excalidraw-export diagram.excalidraw                   # → diagram.png
 *   excalidraw-export diagram.excalidraw -o output.png     # explicit output
 *   excalidraw-export diagram.excalidraw --svg             # → diagram.svg
 *   excalidraw-export diagram.excalidraw --scale 3         # 3x resolution
 *   excalidraw-export diagram.excalidraw --no-background   # transparent bg
 */

import { existsSync } from "fs";
import { basename, extname, resolve } from "path";
import { exportDiagram } from "./index.js";

function printUsage() {
  console.log(`excalidraw-export — Export Excalidraw diagrams to PNG/SVG

Usage:
  excalidraw-export <input.excalidraw> [options]

Options:
  -o, --output <path>    Output file path (default: <input>.png)
  --svg                  Export as SVG instead of PNG
  --scale <n>            Scale factor for PNG (default: 2)
  --no-background        Transparent background
  -h, --help             Show this help

Examples:
  excalidraw-export diagram.excalidraw
  excalidraw-export diagram.excalidraw -o output.svg
  excalidraw-export diagram.excalidraw --scale 3
  excalidraw-export diagram.excalidraw --svg --no-background`);
}

function parseArgs(args) {
  const opts = { scale: 2 };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "-o" || arg === "--output") {
      opts.output = args[++i];
    } else if (arg === "--svg") {
      opts.format = "svg";
    } else if (arg === "--scale") {
      opts.scale = Number(args[++i]);
    } else if (arg === "--no-background") {
      opts.background = "transparent";
    } else if (!arg.startsWith("-")) {
      opts.input = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
    i++;
  }

  return opts;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  printUsage();
  process.exit(1);
}

const opts = parseArgs(args);

if (!opts.input) {
  console.error("Error: No input file specified");
  process.exit(1);
}

const inputPath = resolve(opts.input);

if (!existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`);
  process.exit(1);
}

// Determine output path
const format = opts.format || (opts.output?.endsWith(".svg") ? "svg" : "png");
const outputPath =
  opts.output ||
  resolve(
    basename(inputPath, extname(inputPath)) + "." + format
  );

try {
  const result = exportDiagram(inputPath, outputPath, {
    format,
    scale: opts.scale,
    background: opts.background,
  });

  if (result.format === "png") {
    console.log(
      `✓ ${result.path} (${result.width}×${result.height}, ${formatBytes(result.size)})`
    );
  } else {
    console.log(`✓ ${result.path} (${formatBytes(result.size)})`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
