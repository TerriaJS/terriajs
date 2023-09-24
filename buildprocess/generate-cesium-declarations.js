// This program generates typescript declarations for individual Cesium source
// files. Its output is meant to be pasted into the end of
// `lib/ThirdParty/terriajs-cesium-extra/index.d.ts`.

const fs = require("fs");
const path = require("path");
const glob = require("glob-all");

const cesiumDeclarationFile = require.resolve("terriajs-cesium/index.d.ts");
const cesiumDirectory = path.dirname(cesiumDeclarationFile);

const declrationFileSource = fs.readFileSync(cesiumDeclarationFile).toString();

// The next step is to find the list of Cesium modules exported by the Cesium API
// So that we can map these modules with a link back to their original source file.

const regex = /^export (function|class|namespace|enum|const enum) (.+)/gm;
let matches;
const publicModules = new Set();
//eslint-disable-next-line no-cond-assign
while ((matches = regex.exec(declrationFileSource))) {
  const moduleName = matches[2].match(/([^\s|\(]+)/);
  publicModules.add(moduleName[1]);
}

const sourceFiles = [
  "Source/**/*.js",
  "!Source/*.js",
  "!Source/Workers/**",
  "!Source/WorkersES6/**",
  "Source/WorkersES6/createTaskProcessorWorker.js",
  "!Source/ThirdParty/Workers/**",
  "!Source/ThirdParty/google-earth-dbroot-parser.js",
  "!Source/ThirdParty/_*"
];

function filePathToModuleId(moduleId) {
  return moduleId.substring(0, moduleId.lastIndexOf(".")).replace(/\\/g, "/");
}

let source = "";

// Map individual modules back to their source file so that TS still works
// when importing individual files instead of the entire cesium module.
glob.sync(sourceFiles, { cwd: cesiumDirectory }).forEach(function (file) {
  file = path.relative("Source", file);

  let moduleId = file;
  moduleId = filePathToModuleId(moduleId);

  const assignmentName = path.basename(file, path.extname(file));
  if (publicModules.has(assignmentName)) {
    publicModules.delete(assignmentName);
    source += `declare module "terriajs-cesium/Source/${moduleId}" { import { ${assignmentName} } from 'terriajs-cesium'; export default ${assignmentName}; }\n`;
  }
});

console.log(source);
