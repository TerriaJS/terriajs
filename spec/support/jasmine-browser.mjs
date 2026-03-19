import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwroot = path.resolve(__dirname, "../../wwwroot");
const assets = path.resolve(__dirname, "../../assets");

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
    "/mockServiceWorker.js": express.static(
      path.join(wwwroot, "mockServiceWorker.js")
    ),
    "/": express.static(path.join(wwwroot, "build"), {
      index: false
    }),
    "/test": express.static(path.join(wwwroot, "test"), { index: false }),
    "/languages": express.static(path.join(wwwroot, "build", "languages"), {
      index: false
    }),
    "/chunks": express.static(path.join(wwwroot, "build", "chunks"), {
      index: false
    }),
    "/regionMapping": express.static(
      path.join(wwwroot, "build", "regionMapping"),
      {
        index: false
      }
    ),
    "/images": express.static(path.join(wwwroot, "build", "images"), {
      index: false
    })
  }
};
