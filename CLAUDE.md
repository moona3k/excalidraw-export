# CLAUDE.md

## What is this?

Export Excalidraw diagrams to PNG and SVG. No browser, no DOM, no Playwright — pure computation.

**npm:** `@moona3k/excalidraw-export` (scoped)

## Architecture

```
src/
  cli.js        CLI entry point (--svg, --scale, --no-background)
  index.js      Library entry point (exportDiagram, renderToSvg)
  renderer.js   Excalidraw JSON → SVG string (main rendering pipeline)
  shapes.js     Shape-specific rendering (rect, ellipse, diamond, line, arrow, text, freedraw, image)
  utils.js      SVG string utilities (opsToPath, drawableToSvg, getBoundingBox, escapeXml)
  fonts.js      Virgil font loading (base64 woff2 embedded in SVG)

fonts/
  Virgil-Regular.woff2   Hand-drawn font (SIL OFL licensed)
  LICENSE                Font license

test/
  renderer.test.js   SVG rendering tests
  shapes.test.js     Shape rendering tests
  utils.test.js      Utility function tests
  export.test.js     PNG/SVG export integration tests
  cli.test.js        CLI integration tests
  fixtures/          .excalidraw test inputs
```

## How It Works

1. Parse Excalidraw JSON
2. `rough.generator()` converts shapes to bezier curves (no DOM needed)
3. `drawableToSvg()` converts roughjs output to SVG path elements
4. Assemble complete SVG with embedded Virgil font
5. For PNG: `@resvg/resvg-js` rasterizes SVG → PNG

## Dependencies

| Package | Purpose |
|---------|---------|
| `roughjs` | Hand-drawn shape math (bezier curves) |
| `@resvg/resvg-js` | SVG → PNG rasterization |

## Key Functions

- **`renderToSvg(doc, options)`** — Main pipeline. Returns SVG string.
- **`exportDiagram(inputPath, outputPath, options)`** — File-to-file export.
- **`drawableToSvg(drawable)`** — Converts roughjs Drawable to SVG path elements. Handles `strokeLineDash` for dashed strokes.
- **`getBoundingBox(elements)`** — Computes tight bounding box accounting for rotation.

## Running Tests

```bash
bun test              # 71 tests
bun test test/renderer.test.js  # single file
```

## Building / Publishing

```bash
npm publish --access public   # scoped package, needs --access public
```

No build step. Source + fonts ship directly (ESM, `"type": "module"`).

## Conventions

- ESM only — no `require()`
- LF line endings enforced via `.gitattributes`
- Virgil font is embedded as base64 in the SVG output (see `fonts.js`)
- All SVG generation is string-based — no DOM APIs anywhere
