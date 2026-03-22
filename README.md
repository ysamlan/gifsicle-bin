# gifsicle-bin

[![PyPI](https://img.shields.io/pypi/v/gifsicle-bin)](https://pypi.org/project/gifsicle-bin/) [![License: GPL v2](https://img.shields.io/badge/License-GPL_v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)

Pre-compiled [gifsicle](https://www.lcdf.org/gifsicle/) binary distributed as a Python wheel.

* Developers: Let your Python app take advantage of `gifsicle` optimization without forcing users to do an OS-level installation of it.
* Users: Get GIF optimization powers easily on multiple OSes without needing package installation permissions.

Built for [agent-log-gif](https://github.com/ysamlan/agent-log-gif).

## How is this different from [pygifsicle](https://github.com/LucaCappelletti94/pygifsicle)?

`pygifsicle` requires users to install the `gifsicle` binary separately (`brew install gifsicle`, `apt install gifsicle`, etc.). While `pygifsicle` helps automate this somewhat, this still requires root permissions on most GNU/Linux distributions, and requires users to have Homebrew or manually install `gifsicle` themselves on Mac.

Use `pygifsicle` if you want to leverage the `gifsicle` on user's systems already, and if you don't care which specific version they have.

`gifsicle-bin` bundles the compiled `gifsicle` binary inside the wheel at a deterministic version and makes it available via the `pip`/`uv` dependency resolution mechanisms your Python code already uses.

Use `gifsicle-bin` if you want end users to be able to use `gifsicle` without needing a precondition of `brew install` or `apt install`ing it, or if you want to use a deterministic version of `gifsicle`.

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

## Development instructions for gifsicle-bin

### Updating gifsicle version

gifsicle's original source is used via a clean git submodule without patching or modification.

```bash
cd vendor/gifsicle && git fetch --tags && git checkout vX.Y && cd ../..
```

Update the version in `pyproject.toml` and `config.h.cmake.in` (grep for the old version). If `configure.ac` changed between versions, check for new `HAVE_*` defines and add matching entries to `CMakeLists.txt` + `config.h.cmake.in`.

To publish, create a new tag and release for `vX.Y`. CI will build wheels for all platforms and publish to PyPI via OIDC.

## License

`gifsicle` is Copyright (C) 1997-2025 Eddie Kohler and distributed under the
[GNU General Public License, Version 2](LICENSE).

This package redistributes `gifsicle` as a compiled binary. The source code is
available at <https://github.com/kohler/gifsicle>.

**Using gifsicle-bin from non-GPL programs:**
gifsicle-bin is a convenience package that puts the `gifsicle` CLI on your PATH.
`gifsicle-bin` still requires calling `gifsicle` externally (eg via `subprocess.run`)
as a separate program ("at arms length"). See the FSF's
[Plugins](https://www.gnu.org/licenses/gpl-faq.html#GPLPlugins) and
[Proprietary Systems](https://www.gnu.org/licenses/gpl-faq.html#GPLInProprietarySystem)
FAQs.
