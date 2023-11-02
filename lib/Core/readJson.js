"use strict";

const json5 = require("json5");
const readText = require("./readText");

/**
 * Try to read the file as JSON. If that fails, try JSON5.
 * @param  {File} file The file.
 * @return {Promise<JsonObject>} The JSON or json5 object described by the file.
 */
function readJson(file) {
  return readText(file).then((s) => {
    try {
      return JSON.parse(s);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return json5.parse(s);
      } else {
        throw e;
      }
    }
  });
}

module.exports = readJson;
