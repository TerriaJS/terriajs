"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Gets the values from a Entity's properties object for the time on the current clock.
 *
 * @param properties An entity's property object
 * @param {JulianDate} currentTime The current time if it is a time varying catalog item.
 * @returns {Object} a simple key-value object of properties.
 */
function propertyGetTimeValues(properties, currentTime) {
  // properties itself may be a time-varying "property" with a getValue function.
  // If not, check each of its properties for a getValue function; if it exists, use it to get the current value.
  if (!defined(properties)) {
    return;
  }
  var result = {};
  if (typeof properties.getValue === "function") {
    result = properties.getValue(currentTime);

    // Fixes a bug where FeatureInfoDownload tries to serialize a circular object
    // the _changedEvent._scope property contains _intervals
    // Serializing the Event is not very useful, anyway
    if (result._intervals && result._intervals._changedEvent) {
      result._intervals._changedEvent = undefined;
    }
    return result;
  }
  for (var key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      if (properties[key] && typeof properties[key].getValue === "function") {
        result[key] = properties[key].getValue(currentTime);
      } else {
        result[key] = properties[key];
      }
    }
  }
  return result;
}

module.exports = propertyGetTimeValues;
