import exists from "./exists.js";
import options from "./options.js";
import makeserver from "./makeserver.js";

options.init(false);

console.log(
  `Serving directory "${options.wwwroot}" on port ${options.port} to ${options.listenHost ? options.listenHost : "the world"}.`
);

function warn(message) {
  console.warn(`Warning: ${message}`);
}

if (!exists(options.wwwroot)) {
  warn(`"${options.wwwroot}" does not exist.`);
} else if (!exists(`${options.wwwroot}/index.html`)) {
  warn(`"${options.wwwroot}" is not a TerriaJS wwwroot directory.`);
} else if (!exists(`${options.wwwroot}/build`)) {
  warn(
    `"${options.wwwroot}" has not been built. You should do this:\n\n> cd ${options.wwwroot}/..\n> gulp\n`
  );
}

if (typeof options.settings.allowProxyFor === "undefined") {
  warn(
    'The configuration does not contain a "allowProxyFor" list.  The server will proxy _any_ request.'
  );
}

const server = makeserver(options).listen(options.port, options.listenHost);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${options.port} is already in use`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  } else {
    console.error(err);
  }
});
