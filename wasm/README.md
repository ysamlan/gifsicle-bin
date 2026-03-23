# gifsicle-wasm

[![npm](https://img.shields.io/npm/v/gifsicle-wasm)](https://www.npmjs.com/package/gifsicle-wasm) [![License: GPL v2](https://img.shields.io/badge/License-GPL_v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)

[gifsicle](https://www.lcdf.org/gifsicle/) compiled to WebAssembly with Emscripten. Optimize GIFs entirely in the browser.

Built from a version-controlled submodule of the [original gifsicle source](https://github.com/kohler/gifsicle) in [public CI](https://github.com/ysamlan/gifsicle-bin). Also available as a [Python wheel](https://pypi.org/project/gifsicle-bin/) for native use.

## Install

```bash
npm install gifsicle-wasm
```

## Usage

The WASM module exposes gifsicle's CLI entry point (`_run_gifsicle(argc, argv)`) — you pass command-line arguments, same as invoking the `gifsicle` binary.

```javascript
import createGifsicle from "gifsicle-wasm";

const mod = await createGifsicle();

// Write input GIF to Emscripten virtual filesystem
mod.FS.writeFile("/input.gif", new Uint8Array(gifBuffer));

// Build argv
const args = ["gifsicle", "-O2", "--lossy=80", "-o", "/output.gif", "/input.gif"];
const argv = mod._malloc((args.length + 1) * 4);
const ptrs = [];
for (let i = 0; i < args.length; i++) {
  const p = mod.stringToNewUTF8(args[i]);
  ptrs.push(p);
  mod.setValue(argv + i * 4, p, "i32");
}
mod.setValue(argv + args.length * 4, 0, "i32");

// Run gifsicle
mod._run_gifsicle(args.length, argv);

// Clean up
ptrs.forEach((p) => mod._free(p));
mod._free(argv);

// Read output
const output = mod.FS.readFile("/output.gif");
```

For a complete working example including error handling and Web Worker isolation, see [`gifsicle-worker.js`](https://github.com/ysamlan/agent-log-gif/blob/main/web/gifsicle-worker.js) in the [agent-log-gif](https://github.com/ysamlan/agent-log-gif) project.

## Node.js

Works in Node.js too — pass `wasmBinary` to avoid fetch:

```javascript
import { readFileSync } from "fs";
import createGifsicle from "gifsicle-wasm";

const wasmBinary = readFileSync("node_modules/gifsicle-wasm/dist/gifsicle.wasm");
const mod = await createGifsicle({ wasmBinary });
```
### Building WASM locally

Requires [Emscripten](https://emscripten.org/docs/getting_started/downloads.html), autoconf, and automake.

```bash
bash build.sh
# Output: dist/gifsicle.js + dist/gifsicle.wasm

# Smoke test (requires Node.js)
node test_wasm.mjs
```
## How is this different from [gifsicle-wasm-browser](https://github.com/renzhezhilu/gifsicle-wasm-browser)?

**Provenance:** `gifsicle-bin`'s WASM is built from a version-controlled submodule of the original gifsicle source in public CI.

**Invocation model:** `gifsicle-bin`'s WASM exposes the raw `_run_gifsicle(argc, argv)` gifsicle CLI entry point instead of wrapping as a library. See [License](#License) for more on why we do that.

## Credits

[gifsicle](https://www.lcdf.org/gifsicle/) by Eddie Kohler. WASM build approach based on [Simon Willison's work](https://github.com/simonw/tools).

## License

GPL-2.0-only. See [LICENSE](https://github.com/ysamlan/gifsicle-bin/blob/main/LICENSE).

The WASM module only provides the same command-line-argument interface as the gifsicle binary, and can be run isolated in a separate browser worker. See the FSF's [Plugins](https://www.gnu.org/licenses/gpl-faq.html#GPLPlugins) and [Proprietary Systems](https://www.gnu.org/licenses/gpl-faq.html#GPLInProprietarySystem) FAQs.
