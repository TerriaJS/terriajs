import exists from "./exists.js";
import fs from "node:fs";
import json5 from "json5";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const options = {};

function getFilePath(fileName, warn) {
  if (exists(fileName)) {
    return fileName;
  } else if (warn) {
    console.warn(`Warning: Can't open '${fileName}'.`);
  }
}

function getConfigFile(argFileName, defaultFileName) {
  return argFileName
    ? getFilePath(argFileName, true)
    : getFilePath(defaultFileName);
}

/**
 * Gets a config file using require, logging a warning and defaulting to a backup value in the event of a failure.
 *
 * @param filePath The path to look for the config file.
 * @param configFileType What kind of config file is this? E.g. config, auth etc.
 * @param failureConsequence The consequence of using the defaultValue when this file fails to load - this will be logged
 *        as part of the warning
 * @param quiet Emit logs or not
 * @returns {*} The config, either from the filePath or a default.
 */
function getConfig(filePath, configFileType, failureConsequence, quiet) {
  let config;

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    // Strip comments formatted as lines starting with a #, before parsing as JSON5. #-initial comments are deprecated, will be removed in version 3.
    config = json5.parse(fileContents.replace(/^\s*#.*$/gm, ""));
    if (!quiet) {
      console.log(
        `Using ${configFileType} file "${fs.realpathSync(filePath)}".`
      );
    }
  } catch {
    if (!quiet) {
      const loggedFilePath = filePath ? ` "${filePath}"` : "";
      if (!(loggedFilePath === "" && configFileType === "proxyAuth")) {
        console.warn(
          `Warning: Can't open ${configFileType} file${loggedFilePath}. ${failureConsequence}.\n`
        );
      }
    }
    config = {};
  }

  return config;
}

function loadCommandLine() {
  const argv = yargs(hideBin(process.argv))
    .parserConfiguration({
      "duplicate-arguments-array": false
    })
    .usage("$0 [wwwroot]", "$0 [options] [wwwroot]", (y) => {
      return y.positional("wwwroot", {
        describe: "path/to/wwwroot",
        type: "string"
      });
    })
    .strict()
    .options({
      port: {
        description: "Port to listen on.                [default: 3001]",
        number: true
      },
      public: {
        type: "boolean",
        default: true,
        description: "Run a public server that listens on all interfaces."
      },
      "config-file": {
        description:
          "File containing settings such as allowed domains to proxy. See serverconfig.json.example"
      },
      "proxy-auth": {
        description:
          "File containing auth information for proxied domains. See proxyauth.json.example"
      },
      verbose: {
        description: "Produce more output and logging.",
        type: "boolean",
        default: false
      },
      help: {
        alias: "h",
        type: "boolean",
        description: "Show this help."
      }
    });

  if (argv.argv.help) {
    argv.showHelp();
    // eslint-disable-next-line n/no-process-exit
    process.exit();
  }

  return argv.parseSync();
}

options.init = function (quiet) {
  const argv = loadCommandLine();

  this.listenHost = argv.public ? undefined : "localhost";
  this.configFile = getConfigFile(argv.configFile, "serverconfig.json");
  this.settings = getConfig(
    this.configFile,
    "config",
    "ALL proxy requests will be accepted.",
    quiet
  );
  this.proxyAuthFile = getConfigFile(argv.proxyAuth, "proxyauth.json");
  this.proxyAuth = getConfig(
    this.proxyAuthFile,
    "proxyAuth",
    "Proxying to servers that require authentication will fail",
    quiet
  );

  if (!this.proxyAuth || Object.keys(this.proxyAuth).length === 0) {
    this.proxyAuth = this.settings.proxyAuth || {};
  }

  this.port = argv.port || this.settings.port || 3001;
  this.wwwroot = argv.wwwroot ? argv.wwwroot : `${process.cwd()}/wwwroot`;
  this.configDir = argv.configFile ? path.dirname(argv.configFile) : ".";
  this.verbose = argv.verbose;
  this.hostName = this.listenHost || this.settings.hostName || "localhost";
  this.settings.proxyAllDomains =
    this.settings.proxyAllDomains ||
    typeof this.settings.allowProxyFor === "undefined";
  return options;
};

export default options;
