/**
 * Smoke test for the gifsicle WASM build.
 * Runs in Node.js (no browser needed).
 *
 * Usage: node wasm/test_wasm.mjs
 *
 * Optimizes a GIF from gifsicle's own repo with the WASM module
 * and verifies the output is a valid GIF.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const wasmDir = join(__dirname, "dist");
const testGifPath = join(repoRoot, "vendor", "gifsicle", "logo1.gif");

async function main() {
  const jsPath = join(wasmDir, "gifsicle.js");
  const wasmPath = join(wasmDir, "gifsicle.wasm");

  // Verify build artifacts exist
  try {
    readFileSync(wasmPath);
  } catch {
    console.error(`FAIL: ${wasmPath} not found. Run 'bash wasm/build.sh' first.`);
    process.exit(1);
  }

  // Load test fixture from gifsicle's own repo
  const inputGif = readFileSync(testGifPath);

  // Load Emscripten module
  const { default: createGifsicle } = await import(jsPath);
  const wasmBinary = readFileSync(wasmPath);
  const mod = await createGifsicle({
    wasmBinary,
    print: () => {},
    printErr: () => {},
  });

  // Write test GIF to virtual filesystem
  mod.FS.writeFile("/input.gif", inputGif);

  // Build argv
  const fullArgs = ["gifsicle", "-O2", "-o", "/output.gif", "/input.gif"];
  const argv = mod._malloc((fullArgs.length + 1) * 4);
  const ptrs = [];
  for (let i = 0; i < fullArgs.length; i++) {
    const p = mod.stringToNewUTF8(fullArgs[i]);
    ptrs.push(p);
    mod.setValue(argv + i * 4, p, "i32");
  }
  mod.setValue(argv + fullArgs.length * 4, 0, "i32");

  // Run gifsicle (try/catch: fatal errors call exit() which throws in WASM)
  let rc;
  try {
    rc = mod._run_gifsicle(fullArgs.length, argv);
  } catch (e) {
    rc = -1;
  }

  // Clean up
  ptrs.forEach((p) => mod._free(p));
  mod._free(argv);

  if (rc !== 0) {
    console.error(`FAIL: gifsicle returned exit code ${rc}`);
    process.exit(1);
  }

  // Validate output
  let output;
  try {
    output = mod.FS.readFile("/output.gif");
  } catch {
    console.error("FAIL: /output.gif not found after gifsicle run");
    process.exit(1);
  }

  const magic = String.fromCharCode(...output.slice(0, 6));
  if (!magic.startsWith("GIF")) {
    console.error(`FAIL: output is not a valid GIF (magic: ${magic})`);
    process.exit(1);
  }

  console.log(
    `PASS: input ${inputGif.length} bytes → output ${output.length} bytes (${magic})`
  );
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
