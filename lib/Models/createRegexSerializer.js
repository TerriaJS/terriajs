"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Serializes a regex like /.foo/i into ".foo".
 *
 * @param  {String} fieldName The name of the field to serialize.
 * @return {Function} The deserialization function.
 */
function createRegexSerializer(fieldName) {
  return function(ckanGroup, json, propertyName, options) {
    if (defined(ckanGroup[fieldName])) {
      json[fieldName] = ckanGroup[fieldName].source;
    }
  };
}

module.exports = createRegexSerializer;
