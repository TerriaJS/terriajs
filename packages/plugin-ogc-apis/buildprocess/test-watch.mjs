/**
 * Continuously build and run the browser specs in the terminal.
 *
 * Runs `webpack --watch` for fast incremental rebuilds, and after each
 * successful compile re-runs the headless jasmine specs (`runSpecs`), printing
 * pass/fail to the console. Spec runs are serialised — if a rebuild lands while
 * specs are running, one more run is queued for when it finishes.
 *
 * Dependency-free (uses only Node built-ins). Started via `npm run test-watch`.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { cwd: pkgRoot, shell: true, ...opts });
}

// 1. webpack in watch mode — pipe its output so we can both show it and detect
//    when a (re)build finishes.
const webpack = run("npx", [
  "webpack",
  "build",
  "--config",
  "buildprocess/webpack.config.specs.js",
  "--mode",
  "development",
  "--watch"
]);

let running = false;
let queued = false;

function runSpecs() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  console.log("\n⏵  Running specs...\n");
  const specs = run("npx", [
    "jasmine-browser-runner",
    "runSpecs",
    "--config=spec/support/jasmine-browser.mjs"
  ]);
  specs.stdout.on("data", (d) => process.stdout.write(d));
  specs.stderr.on("data", (d) => process.stderr.write(d));
  specs.on("exit", () => {
    running = false;
    console.log("\n… watching for changes (Ctrl+C to stop)\n");
    if (queued) {
      queued = false;
      runSpecs();
    }
  });
}

webpack.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text);
  // webpack prints "... compiled successfully|with N warnings|with N errors"
  // at the end of every (re)build.
  if (/compiled/.test(text)) {
    runSpecs();
  }
});
webpack.stderr.on("data", (d) => process.stderr.write(d));

function shutdown() {
  webpack.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
