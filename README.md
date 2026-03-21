# gifsicle-bin

Pre-compiled [gifsicle](https://www.lcdf.org/gifsicle/) binary distributed as a Python wheel.

Install with pip/uv and get `gifsicle` in your PATH — no `brew install` or `apt install` needed.

### How is this different from [pygifsicle](https://github.com/LucaCappelletti94/pygifsicle)?

pygifsicle is a Python wrapper that calls gifsicle, but **requires you to install the gifsicle binary separately** (`brew install gifsicle`, `apt install gifsicle`, etc.). This package **bundles the compiled gifsicle binary itself** inside the wheel — nothing else to install. It compiles gifsicle from source for each platform via cibuildwheel.

## Installation

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

## Updating gifsicle version

gifsicle source is a clean git submodule — zero patches.

```bash
cd vendor/gifsicle && git fetch --tags && git checkout v1.XX && cd ../..
```

Update the version in `pyproject.toml` and `config.h.cmake.in` (grep for the old version). If `configure.ac` changed between versions, check for new `HAVE_*` defines and add matching entries to `CMakeLists.txt` + `config.h.cmake.in`.

## License

gifsicle is Copyright (C) 1997-2025 Eddie Kohler and distributed under the
[GNU General Public License, Version 2](LICENSE).

This package redistributes gifsicle as a compiled binary. The source code is
available at https://github.com/kohler/gifsicle.
