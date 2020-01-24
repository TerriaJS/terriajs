"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
/**
 * Updates an object from a JSON representation of the object.  Only properties that actually exist on the object are read from the JSON,
 * and the object has the opportunity to inject specialized deserialization logic by providing an `updaters` property.
 * @param {Object} target The object to update from the JSON.
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 * @param {Object} [options] Optional parameters to custom updaters.
 * @return {Promise} A promise that resolves when the update completes.
 */
function updateFromJson(target, json, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  var promises = [];

  for (var propertyName in target) {
    if (
      target.hasOwnProperty(propertyName) &&
      shouldBeUpdated(target, propertyName, json)
    ) {
      if (target.updaters && target.updaters[propertyName]) {
        promises.push(
          target.updaters[propertyName](target, json, propertyName, options)
        );
      } else {
        target[propertyName] = json[propertyName];
      }
    }
  }

  return when.all(promises);
}

/**
 * Determines whether this property is valid for updating.
 */
function shouldBeUpdated(target, propertyName, json) {
  return (
    json[propertyName] !== undefined && // Must have a value to update to
    propertyName.length > 0 && // Must have a name to update
    propertyName[0] !== "_" && // Must not be a private property
    (propertyName !== "id" || !defined(target.id))
  ); // Must not be overwriting 'id'
}

module.exports = updateFromJson;
