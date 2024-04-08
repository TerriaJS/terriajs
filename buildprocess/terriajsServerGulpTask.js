/**
 * terriajs-server gulp task. Runs terriajs-server.
 * Used in terriajs & TerriaMap gulpfiles.
 * @param {number | undefined} defaultPort - the default port that terriajs-server should run on
 * @returns {(done: (error?: Error) => void) => void} A gulp task
 */
const terriajsServerGulpTask = (defaultPort = undefined) => {
  return (done) => {
    // E.g. gulp terriajs-server --terriajsServerArg port=4000 --terriajsServerArg verbose=true
    //  or gulp dev --terriajsServerArg port=3000
    const { spawn } = require("child_process");
    const fs = require("fs");
    const minimist = require("minimist");
    // Arguments written in skewer-case can cause problems (unsure why), so stick to camelCase
    const options = minimist(process.argv.slice(2), {
      string: ["terriajsServerArg"],
      default: { terriajsServerArg: [] }
    });

    const logFile = fs.openSync("./terriajs-server.log", "w");
    const serverArgs = Array.isArray(options.terriajsServerArg)
      ? options.terriajsServerArg
      : [options.terriajsServerArg];
    if (defaultPort !== undefined) {
      serverArgs.splice(0, 0, `port=${defaultPort}`);
    }
    const child = spawn(
      "node",
      [
        require.resolve("terriajs-server/terriajs-server.js"),
        ...serverArgs.map((arg) => `--${arg}`)
      ],
      { detached: true, stdio: ["ignore", logFile, logFile] }
    );
    child.on("exit", (exitCode, signal) => {
      done(
        new Error(
          "terriajs-server quit" +
            (exitCode !== null ? ` with exit code: ${exitCode}` : "") +
            (signal ? ` from signal: ${signal}` : "") +
            "\nCheck terriajs-server.log for more information."
        )
      );
    });
    child.on("spawn", () => {
      console.log("terriajs-server started - see terriajs-server.log for logs");
    });
    // Intercept SIGINT, SIGTERM and SIGHUP, cleanup terriajs-server and re-send signal
    // May fail to catch some relevant signals on Windows
    // SIGINT: ctrl+c
    // SIGTERM: kill <pid>
    // SIGHUP: terminal closed
    function stopServer() {
      child.kill("SIGTERM");
      console.log("terriajs-server stopped");
    }
    process.once("SIGINT", () => {
      stopServer();
      process.kill(process.pid, "SIGINT");
    });
    process.once("SIGTERM", () => {
      stopServer();
      process.kill(process.pid, "SIGTERM");
    });
    process.once("SIGHUP", () => {
      stopServer();
      process.kill(process.pid, "SIGHUP");
    });
    process.on("exit", stopServer);
  };
};

module.exports = terriajsServerGulpTask;
