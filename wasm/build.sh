#!/bin/bash
# Build gifsicle as a WASM module using Emscripten.
# Requires: emcc (Emscripten), autoconf, automake
#
# The WASM build approach is based on Simon Willison's gifsicle WASM work:
# https://github.com/simonw/tools
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GIFSICLE_DIR="$REPO_ROOT/vendor/gifsicle"
WASM_DIR="$REPO_ROOT/wasm"
BUILD_DIR="/tmp/gifsicle-wasm-build"

# Verify submodule is initialized
if [ ! -f "$GIFSICLE_DIR/src/gifsicle.c" ]; then
  echo "ERROR: Missing gifsicle sources. Run: git submodule update --init --recursive"
  exit 1
fi

echo "==> Cleaning previous build..."
rm -rf "$BUILD_DIR"

echo "==> Copying source to build directory..."
cp -r "$GIFSICLE_DIR" "$BUILD_DIR"
cp "$WASM_DIR/entry.c" "$BUILD_DIR/"

cd "$BUILD_DIR"

echo "==> Running autoreconf..."
autoreconf -fi

echo "==> Configuring for Emscripten..."
emconfigure ./configure \
  --host=wasm32-unknown-emscripten \
  --disable-gifview \
  --disable-gifdiff \
  --disable-threads \
  --disable-simd

echo "==> Compiling with emcc..."
emcc -O2 -g0 \
  -DHAVE_CONFIG_H -I. -Iinclude \
  src/gifsicle.c src/clp.c src/fmalloc.c src/giffunc.c src/gifread.c \
  src/gifwrite.c src/gifunopt.c src/merge.c src/optimize.c src/quantize.c \
  src/support.c src/xform.c src/kcolor.c entry.c \
  -o gifsicle.js \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createGifsicle" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s 'EXPORTED_FUNCTIONS=["_run_gifsicle","_malloc","_free"]' \
  -s 'EXPORTED_RUNTIME_METHODS=["FS","ccall","cwrap","stringToNewUTF8","UTF8ToString","setValue"]' \
  -s INVOKE_RUN=0 \
  -s FORCE_FILESYSTEM=1 \
  -lm

echo "==> Copying output..."
mkdir -p "$WASM_DIR/dist"
cp gifsicle.js "$WASM_DIR/dist/gifsicle.js"
cp gifsicle.wasm "$WASM_DIR/dist/gifsicle.wasm"

echo "==> Cleaning up..."
rm -rf "$BUILD_DIR"

echo "==> Done! Output files:"
ls -la "$WASM_DIR/dist/gifsicle.js" "$WASM_DIR/dist/gifsicle.wasm"
