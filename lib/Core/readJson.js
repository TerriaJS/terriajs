"use strict";

/*global require*/
var json5 = require("json5");
var readText = require("./readText");

var when = require("terriajs-cesium/Source/ThirdParty/when").default;

/**
 * Try to read the file as JSON. If that fails, try JSON5.
 * @param  {File} file The file.
 * @return {Object} The JSON or json5 object described by the file.
 */
function readJson(file) {
  return when(
    readText(file),
    function(result) {
      try {
        return JSON.parse(result);
      } catch (e) {
        if (e instanceof SyntaxError) {
          return json5.parse(result);
        } else {
          throw e;
        }
      }
    },
    function(e) {
      throw e;
    }
  );
}

module.exports = readJson;
