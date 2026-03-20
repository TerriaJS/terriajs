import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwroot = path.resolve(__dirname, "../wwwroot");

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
    "/": express.static(wwwroot, { index: false }),
    "/build/TerriaJS/build/": express.static(path.join(wwwroot, "build"), {
      index: false
    })
  }
};
