var path = require("path");

module.exports = [
  path.resolve(__dirname, "../lib/Models/*CatalogItem.js"),
  path.resolve(__dirname, "../lib/Models/*CatalogGroup.js"),
  path.resolve(__dirname, "../lib/Models/*CatalogMember.js"),
  path.resolve(__dirname, "../lib/Models/*CatalogFunction.js"),
  "!" + path.resolve(__dirname, "../lib/Models/addUserCatalogMember.js"),
  "!" +
    path.resolve(__dirname, "../lib/Models/AsyncFunctionResultCatalogItem.js")
];
