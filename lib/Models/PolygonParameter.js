"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

/**
 * A parameter that specifies an arbitrary polygon on the globe.
 *
 * @alias PolygonParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.defaultValue] The default value.
 */
var PolygonParameter = function(options) {
  FunctionParameter.call(this, options);
};

inherit(FunctionParameter, PolygonParameter);

Object.defineProperties(PolygonParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof PolygonParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "polygon";
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof PolygonParameter.prototype
   * @member {Number[][][]} value
   */
});

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
PolygonParameter.prototype.formatValueAsString = function(value) {
  value = defaultValue(value, this.value);
  if (!defined(value)) {
    return "-";
  }

  const pointsLongLats = value[0];

  let polygon = "";
  for (let i = 0; i < pointsLongLats.length; i++) {
    polygon +=
      "[" +
      pointsLongLats[i][0].toFixed(3) +
      ", " +
      pointsLongLats[i][1].toFixed(3) +
      "]";
    if (i !== pointsLongLats.length - 1) {
      polygon += ", ";
    }
  }
  if (polygon.length > 0) {
    return "[" + polygon + "]";
  } else {
    return "";
  }
};

/**
 * Get feature as geojson for display on map.
 * @param {Object} value Value to use.
 * @return GeoJson object.
 */
PolygonParameter.prototype.getGeoJsonFeature = function(value) {
  value = defaultValue(value, this.value);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: value
    }
  };
};

/**
 * Process value so that it can be used in an URL.
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
PolygonParameter.formatValueForUrl = function(value) {
  return JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: value
        }
      }
    ]
  });
};

PolygonParameter.formatValueAsString =
  PolygonParameter.prototype.formatValueAsString;
PolygonParameter.getGeoJsonFeature =
  PolygonParameter.prototype.getGeoJsonFeature;
module.exports = PolygonParameter;
