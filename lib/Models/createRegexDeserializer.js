"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Deserializes a regex like ".foo" into a case-insensitive regex /.foo/i.
 *
 * @param  {String} fieldName The name of the field to serialize.
 * @return {Function} The deserialization function.
 */
function createRegexDeserializer(fieldName) {
  return function(catalogMember, json, propertyName, options) {
    if (defined(json[fieldName])) {
      // eslint-disable-next-line i18next/no-literal-string
      catalogMember[fieldName] = new RegExp(json[fieldName], "i");
    }
  };
}

module.exports = createRegexDeserializer;
