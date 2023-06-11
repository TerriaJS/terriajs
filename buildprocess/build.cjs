const esbuild = require("esbuild");
const svgr = require("esbuild-plugin-svgr");
const fs = require("fs");
const path = require("path");
const babelPlugin = require("./babelPlugin.cjs");
const transformJsxControlStatements = require("./babelPluginTransformJsxControlStatements.cjs");
const terriaSassModulesPlugin = require("./terriaSassModulesPlugin.cjs");

const modules = [
  "Charts",
  "Core",
  "Language",
  "Map",
  "ModelMixins",
  "Models",
  "Overrides",
  "ReactViewModels",
  "ReactViews",
  "Styled",
  "Table",
  "Traits",
  "ViewModels"
];

fs.writeFileSync("./lib/index.ts", "", { encoding: "utf-8" });

for (const module of modules) {
  fs.appendFileSync(
    "./lib/index.ts",
    `export * as ${module} from "./${module}/index";\n`,
    { encoding: "utf-8" }
  );

  const entries = fs.readdirSync(`./lib/${module}`, {
    recursive: true,
    withFileTypes: true
  });
  fs.writeFileSync(`./lib/${module}/index.ts`, "", { encoding: "utf-8" });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const name = entry.name;
    const extension = path.extname(name);
    if (!name.match(/.[tj]sx?/)) continue;

    const noExtension = name.substring(0, name.length - extension.length);
    if (noExtension == "index") continue;

    const identifier = noExtension.replace(/[.-]/g, "");

    fs.appendFileSync(
      `./lib/${module}/index.ts`,
      `export * as ${identifier} from "./${noExtension}";\n`,
      { encoding: "utf-8" }
    );
  }
}

const includePaths = [
  // Support resolving paths like "terriajs/..."
  path.resolve(path.dirname(require.resolve("../package.json")), ".."),
  path.resolve(path.dirname(require.resolve("rc-slider/package.json")), ".."),
  path.resolve(
    path.dirname(require.resolve("react-anything-sortable/package.json")),
    ".."
  )
];

esbuild.build({
  target: "es2019",
  entryPoints: ["./lib/index.ts"],
  bundle: true,
  outdir: "dist",
  jsx: "transform",
  sourcemap: true,
  format: "esm",
  splitting: true,
  define: {
    "process.env.NODE_ENV": '"' + (process.env.NODE_ENV ?? "Development") + '"',
    "module.hot": "false",
    global: "globalThis"
  },
  plugins: [
    terriaSassModulesPlugin({ includePaths }),
    svgr({
      plugins: ["@svgr/plugin-jsx"],
      dimensions: true
    }),
    babelPlugin({
      filter: /\.[jt]sx$/,
      config: {
        plugins: [
          //"babel-plugin-jsx-control-statements",
          transformJsxControlStatements,
          "@babel/plugin-syntax-typescript",
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          "@babel/proposal-class-properties",
          "babel-plugin-syntax-jsx",
          "babel-plugin-macros",
          "babel-plugin-styled-components"
        ]
      }
    })
  ],
  loader: {
    ".gif": "file",
    ".png": "file",
    ".jpg": "file",
    ".svg": "file",
    ".html": "text",
    ".glb": "file",
    ".xml": "file",
    ".DAC": "file"
  },
  external: [
    // Don't try to load node-only modules and other unnecessary stuff
    "fs",
    "path",
    "http",
    "https",
    "zlib",
    "../../wwwroot/images/drag-drop.svg",
    "../../../../wwwroot/images/TimelineIcons.png"
    //"geojson-stream"
  ]
});

// esbuild
//   .build({
//     entryPoints: ["index.js"],
//     bundle: true,
//     outfile: "wwwroot/esbuild/TerriaMap.js",
//     publicPath: "/esbuild",
//     jsx: "transform",
//     define: {
//       "process.env.NODE_ENV":
//         '"' + (process.env.NODE_ENV ?? "Development") + '"',
//       "module.hot": "false",
//       global: "globalThis"
//     },
//     sourcemap: true,
//     plugins: [
//       terriaSassModulesPlugin({ includePaths }),
//       svgr({
//         plugins: ["@svgr/plugin-jsx"],
//         dimensions: true
//       }),
//       babelPlugin({
//         filter: /\.[jt]sx$/,
//         config: {
//           plugins: [
//             //"babel-plugin-jsx-control-statements",
//             transformJsxControlStatements,
//             "@babel/plugin-syntax-typescript",
//             ["@babel/plugin-proposal-decorators", { legacy: true }],
//             "@babel/proposal-class-properties",
//             "babel-plugin-syntax-jsx",
//             "babel-plugin-macros",
//             "babel-plugin-styled-components"
//           ]
//         }
//       })
//     ],
//     loader: {
//       ".gif": "file",
//       ".png": "file",
//       ".jpg": "file",
//       ".svg": "file",
//       ".html": "text",
//       ".glb": "file",
//       ".xml": "file",
//       ".DAC": "file"
//     },
//     external: [
//       // Don't try to load node-only modules and other unnecessary stuff
//       "fs",
//       "path",
//       "http",
//       "https",
//       "zlib",
//       "../../wwwroot/images/drag-drop.svg",
//       "../../../../wwwroot/images/TimelineIcons.png"
//       //"geojson-stream"
//     ]
//   })
//   .then((result) => {
//     console.log("success");
//     //console.log(result);
//   })
//   .catch((e) => {
//     console.log("error");
//     //console.error("ERRORS!", e);
//   });
