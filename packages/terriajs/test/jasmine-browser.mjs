import express from "express";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwroot = path.resolve(__dirname, "../wwwroot");
// MSW's service worker, from the installed package so it matches the msw the
// specs import
const mockServiceWorker = createRequire(import.meta.url).resolve(
  "msw/mockServiceWorker.js"
);

export default {
  srcDir: "wwwroot",
  srcFiles: [],
  specDir: "wwwroot",
  specFiles: ["build/TerriaJS-specs.js"],
  helpers: [],

  env: {
    random: false
  },

  browser: "headlessChrome",

  port: 9876,

  middleware: {
    // pnpm installs it under node_modules/.pnpm, a dot-directory send skips
    "/mockServiceWorker.js": (_request, response) =>
      response.sendFile(mockServiceWorker, { dotfiles: "allow" }),
    "/": express.static(wwwroot, { index: false }),
    "/build/TerriaJS/build/": express.static(path.join(wwwroot, "build"), {
      index: false
    })
  }
};
