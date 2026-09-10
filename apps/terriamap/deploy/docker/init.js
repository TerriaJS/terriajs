#!/usr/bin/env node

// Minimal PID-1 init for the deploy container. node:24-slim has no init system, and
// terriajs-server registers no SIGTERM/SIGINT handlers of its own, so without this,
// `docker stop` (and Kubernetes' pod termination, which works the same way) has
// nothing to catch the signal - the container just sits until the grace period
// expires and gets SIGKILLed. This forwards the signal to the real process and exits
// with its status, which is all that's needed here.
//
// It's not a full replacement for tini/dumb-init: it doesn't reap arbitrary orphaned
// grandchild zombies (tini's waitpid-loop over every child, not just its direct one).
// That's fine only because terriajs-server never spawns subprocesses of its own - if
// that ever changes, revisit this.

const { spawn } = require("child_process");

const child = spawn(process.argv[2], process.argv.slice(3), {
  stdio: "inherit"
});

for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(sig, () => child.kill(sig));
}

child.on("exit", (code, signal) => {
  process.exit(signal ? 128 + require("os").constants.signals[signal] : code);
});
