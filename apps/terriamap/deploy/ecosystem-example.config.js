/*global __dirname*/
const os = require("os");
const path = require("path");

// You can start a production server with:
//    pm2 start deploy/ecosystem-example.config.js --update-env --env production
// Or configure it to run automatically as a daemon (systemd, upstart, launchd, rcd) with:
//    pm2 startup systemd

module.exports = {
  apps: [
    {
      name: path.basename(path.resolve(__dirname, "..")) + "-production",
      script: require.resolve("terriajs-server"),

      // Add arguments to terriajs-server to the following, e.g. --port 4000
      args: "--config-file productionserverconfig.json",
      instances: Math.max(4, os.cpus().length),
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
