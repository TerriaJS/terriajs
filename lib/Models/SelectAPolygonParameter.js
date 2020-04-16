"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");

/**
 * A parameter that specifies an arbitrary polygon on the globe, which has been selected from a different layer.
 *
 * @alias SelectAPolygonParameter
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
var SelectAPolygonParameter = function(options) {
  FunctionParameter.call(this, options);
};

inherit(FunctionParameter, SelectAPolygonParameter);

Object.defineProperties(SelectAPolygonParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof SelectAPolygonParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "polygon";
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof SelectAPolygonParameter.prototype
   * @member {Number[][][]} value
   */
});

/**
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
SelectAPolygonParameter.formatValueForUrl = function(value, parameter) {
  if (!defined(value) || value === "") {
    return undefined;
  }
  var featureList = value.map(function(featureData) {
    return {
      type: "Feature",
      crs: featureData.crs,
      geometry: featureData.geometry
    };
  });

  return JSON.stringify({
    type: "FeatureCollection",
    features: featureList
  });
};

SelectAPolygonParameter.formatValueAsString = function(value) {
  if (!defined(value)) {
    return "-";
  }
  return value
    .map(function(featureData) {
      return featureData.id;
    })
    .join(", ");
};

SelectAPolygonParameter.getGeoJsonFeature = function(value) {
  return value.map(function(featureData) {
    return {
      type: "Feature",
      crs: featureData.crs,
      geometry: featureData.geometry
    };
  });
};

module.exports = SelectAPolygonParameter;
