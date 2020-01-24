"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

/**
 * Serializes an object to JSON.
 * @param {Object} target The object to serialize.
 * @param {Function} filterFunction A function that, when passed the name of a property as its only parameter, returns true if that property should be serialized and false otherwise.
 * @param {Object} [options] Optional parameters to custom serializers.
 * @return {Object} An object literal corresponding to the serialized object, ready to pass to `JSON.stringify`.
 */
function serializeToJson(target, filterFunction, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  filterFunction = defaultValue(filterFunction, function() {
    return true;
  });

  var result = {};

  for (var propertyName in target) {
    if (
      target.hasOwnProperty(propertyName) &&
      propertyName.length > 0 &&
      propertyName[0] !== "_" &&
      propertyName !== "parent" &&
      filterFunction(propertyName, target)
    ) {
      if (target.serializers && target.serializers[propertyName]) {
        target.serializers[propertyName](target, result, propertyName, options);
      } else {
        result[propertyName] = target[propertyName];
      }
    }
  }

  return result;
}

module.exports = serializeToJson;
