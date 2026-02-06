# excalidraw-export

Export Excalidraw diagrams to PNG and SVG from the command line.

No browser, no Playwright, no DOM. Pure computation using [roughjs](https://roughjs.com) for hand-drawn effects and [@resvg/resvg-js](https://github.com/nicolo-ribaudo/resvg-js) for SVG-to-PNG rendering.

## Install

```bash
npm install -g @moona3k/excalidraw-export
```

Or use directly with npx:

```bash
npx @moona3k/excalidraw-export diagram.excalidraw
```

## Usage

```bash
# Export to PNG (default, 2x scale)
excalidraw-export diagram.excalidraw

# Export to SVG
excalidraw-export diagram.excalidraw --svg

# Custom output path
excalidraw-export diagram.excalidraw -o output.png

# Higher resolution
excalidraw-export diagram.excalidraw --scale 3

# Transparent background
excalidraw-export diagram.excalidraw --no-background
```

## Programmatic API

```js
import { exportDiagram, renderToSvg } from "@moona3k/excalidraw-export";

// Export to file
exportDiagram("input.excalidraw", "output.png", { scale: 2 });

// Get SVG string
const doc = JSON.parse(fs.readFileSync("input.excalidraw", "utf-8"));
const svg = renderToSvg(doc);
```

## Supported Elements

- Rectangles (with rounded corners)
- Ellipses
- Diamonds
- Lines and arrows (with arrowheads)
- Text (Virgil hand-drawn font embedded)
- Freedraw paths

## How It Works

Uses `rough.generator()` from roughjs which outputs pure math (bezier curves) without needing DOM or Canvas APIs. The generator output is converted to SVG path strings, assembled into a complete SVG document with embedded Virgil font, then rasterized to PNG via resvg.

~600 lines of code. 3 dependencies. Typically exports in under 100ms.
