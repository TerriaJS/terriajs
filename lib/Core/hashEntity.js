"use strict";

var hashFromString = require("./hashFromString");
var propertyGetTimeValues = require("./propertyGetTimeValues");
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

/**
 * Hashes a Cesium {@link Entity} (used by us for features) by stringifying its properties and name.
 *
 * @param feature The feature to hash
 * @param clock A clock that will be used to resolve the property values.
 * @returns {Number} the hash, as an integer.
 */
module.exports = function hashEntity(feature, clock) {
  return hashFromString(
    JSON.stringify(
      propertyGetTimeValues(defaultValue(feature.properties, {}), clock)
    ) + feature.name
  );
};
