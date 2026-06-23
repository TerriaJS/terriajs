"use strict";

var fs = require("fs");
var path = require("path");

function generateI18nTypes(terriaDir) {
  var { mergeResourcesAsInterface } = require("i18next-resources-for-ts");

  var inputDir = path.join(terriaDir, "wwwroot/languages/en/");
  var outputFile = path.join(terriaDir, "lib/ThirdParty/i18n/resources.d.ts");

  var namespaces = fs
    .readdirSync(inputDir)
    .filter(function (file) {
      return file.endsWith(".json");
    })
    .map(function (file) {
      return {
        name: path.parse(file).name,
        path: path.join(inputDir, file),
        resources: JSON.parse(
          fs.readFileSync(path.join(inputDir, file), "utf-8")
        )
      };
    });

  var typeDefinition = mergeResourcesAsInterface(namespaces, {});
  fs.writeFileSync(outputFile, typeDefinition, "utf-8");
}

module.exports = generateI18nTypes;
