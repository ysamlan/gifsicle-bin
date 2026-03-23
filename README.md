# gifsicle-bin

[![PyPI](https://img.shields.io/pypi/v/gifsicle-bin)](https://pypi.org/project/gifsicle-bin/) [![License: GPL v2](https://img.shields.io/badge/License-GPL_v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)

Pre-compiled [gifsicle](https://www.lcdf.org/gifsicle/) binary distributed as a Python wheel and as WASM/JS for browser use.

* Python developers: Let your app take advantage of `gifsicle` optimization without forcing users to do an OS-level installation of it.
* Frontend developers: Add trustworthy Gifsicle optimization without needing a backend (or requiring heavy processing server-side).
* End users: Get GIF optimization powers easily on multiple OSes without needing package installation permissions.

Built for [agent-log-gif](https://github.com/ysamlan/agent-log-gif).

## How is this different from [pygifsicle](https://github.com/LucaCappelletti94/pygifsicle)?

`pygifsicle` requires users to install the `gifsicle` binary separately (`brew install gifsicle`, `apt install gifsicle`, etc.). While `pygifsicle` helps automate this somewhat, this still requires root permissions on most GNU/Linux distributions, and requires users to have Homebrew or manually install `gifsicle` themselves on Mac.

Use `pygifsicle` if you want to leverage the `gifsicle` on user's systems already, and if you don't care which specific version they have.

`gifsicle-bin` bundles the compiled `gifsicle` binary inside the wheel at a deterministic version and makes it available via the `pip`/`uv` dependency resolution mechanisms your Python code already uses.

Use `gifsicle-bin` if you want end users to be able to use `gifsicle` without needing a precondition of `brew install` or `apt install`ing it, or if you want to use a deterministic version of `gifsicle`.

## How is this different from [gifsicle-wasm-browser](https://github.com/renzhezhilu/gifsicle-wasm-browser)?

**Provenance:** `gifsicle-bin`'s WASM is built from a version-controlled submodule of the original gifsicle source in public CI.

**Invocation model:** `gifsicle-bin`'s WASM exposes the raw `_run_gifsicle(argc, argv)` gifsicle CLI entry point instead of wrapping as a library. See [License](#License) for more on why we do that.

## Manual Installation

```bash
pip install gifsicle-bin
# or
uv add gifsicle-bin
```

## Usage

Once installed, `gifsicle` is available as a command:

```bash
gifsicle -O2 --lossy=80 input.gif -o output.gif
```

Or from Python:

```python
import subprocess
subprocess.run(["gifsicle", "-O2", "--lossy=80", "input.gif", "-o", "output.gif"])
```

To use `gifsicle` provided by `gifsicle-bin` as a one off (in a CI build step, etc.):

```bash
uvx gifsicle-bin
```

(eg `uvx gifsicle-bin -O2 input.gif -o output.gif`)

## WASM build

In addition to native wheels, `gifsicle-bin` builds gifsicle as a WebAssembly module for browser use. The WASM artifacts (`gifsicle.js` + `gifsicle.wasm`) are attached to each [GitHub Release](https://github.com/ysamlan/gifsicle-bin/releases) as downloadable assets.

The WASM build produces an Emscripten modularized module. Load it in JavaScript:

```javascript
const mod = await createGifsicle();
// Write input GIF to Emscripten virtual filesystem
mod.FS.writeFile("/input.gif", new Uint8Array(gifBuffer));
// Run gifsicle
mod._run_gifsicle(argc, argv);
// Read output
const output = mod.FS.readFile("/output.gif");
```

For a complete working example including argv construction, see [`gifsicle-worker.js`](https://github.com/ysamlan/agent-log-gif/blob/main/web/gifsicle-worker.js) in the [agent-log-gif](https://github.com/ysamlan/agent-log-gif) project.

The WASM approach is based on [Simon Willison's gifsicle WASM build](https://github.com/simonw/tools) for his [tools.simonwillison.net](https://tools.simonwillison.net/) project.

## Development instructions for gifsicle-bin

### Updating gifsicle version

gifsicle's original source is used via a clean git submodule without patching or modification.

```bash
cd vendor/gifsicle && git fetch --tags && git checkout vX.Y && cd ../..
```

Update the version in `wasm/package.json`, `pyproject.toml` and `config.h.cmake.in` (grep for the old version). If `configure.ac` changed between versions, check for new `HAVE_*` defines and add matching entries to `CMakeLists.txt` + `config.h.cmake.in`.

To publish, create a new tag and release for `vX.Y`. CI will build native wheels for all platforms (published to PyPI via OIDC) and WASM artifacts (attached to the GitHub Release).

### Building WASM locally

Requires [Emscripten](https://emscripten.org/docs/getting_started/downloads.html), autoconf, and automake.

```bash
bash wasm/build.sh
# Output: wasm/dist/gifsicle.js + wasm/dist/gifsicle.wasm

# Smoke test (requires Node.js)
node wasm/test_wasm.mjs
```

## License

`gifsicle` is Copyright (C) 1997-2025 Eddie Kohler and distributed under the
[GNU General Public License, Version 2](LICENSE).

This package redistributes `gifsicle` as a compiled binary. The source code is
available at <https://github.com/kohler/gifsicle>.

**GPL Information:**
gifsicle-bin is a convenience package that puts the `gifsicle` CLI on your PATH.
`gifsicle-bin` still requires calling `gifsicle` externally (eg via `subprocess.run`)
as a separate program at arms length. See the FSF's
[Plugins](https://www.gnu.org/licenses/gpl-faq.html#GPLPlugins) and
[Proprietary Systems](https://www.gnu.org/licenses/gpl-faq.html#GPLInProprietarySystem)
FAQs.

The WASM version only provides the same command-line-argument interface as the main gifsicle binary, and can be run isolated in a separate browser worker.