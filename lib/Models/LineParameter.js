"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

/**
 * A parameter that specifies a line on the globe.
 *
 * @alias LineParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter. If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.defaultValue] The default value.
 */
var LineParameter = function(options) {
  FunctionParameter.call(this, options);
};

inherit(FunctionParameter, LineParameter);

Object.defineProperties(LineParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof LineParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "line";
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof LineParameter.prototype
   * @member {Number[][]} value
   */
});

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
LineParameter.prototype.formatValueAsString = function(value) {
  value = defaultValue(value, this.value);
  if (!defined(value)) {
    return "-";
  }

  let line = "";
  for (let i = 0; i < value.length; i++) {
    line += "[" + value[i][0].toFixed(3) + ", " + value[i][1].toFixed(3) + "]";
    if (i !== value.length - 1) {
      line += ", ";
    }
  }
  if (line.length > 0) {
    return line;
  } else {
    return "";
  }
};

/**
 * Get feature as geojson for display on map.
 * @param {Object} value Value to use.
 * @return GeoJson object.
 */
LineParameter.prototype.getGeoJsonFeature = function(value) {
  value = defaultValue(value, this.value);

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: value
    }
  };
};

/**
 * Process value so that it can be used in an URL.
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
LineParameter.formatValueForUrl = function(value) {
  return JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: value
        }
      }
    ]
  });
};

LineParameter.formatValueAsString = LineParameter.prototype.formatValueAsString;
LineParameter.getGeoJsonFeature = LineParameter.prototype.getGeoJsonFeature;
module.exports = LineParameter;
