"use strict";

/*global require*/
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var Reproject = require("../Map/Reproject");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var rectangleToPolygonArray = require("../Core/rectangleToPolygonArray");

/**
 * A parameter that specifies a bounding box/extent on the globe.
 *
 * @alias RectangleParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.defaultValue] The default value.
 * @param {String} [options.crs] The Coordinate Reference System to use.
 */
var RectangleParameter = function(options) {
  FunctionParameter.call(this, options);

  this.crs = defaultValue(options.crs, Reproject.TERRIA_CRS);
};

inherit(FunctionParameter, RectangleParameter);

Object.defineProperties(RectangleParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof DateTimeParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "rectangle";
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof RectangleParameter.prototype
   * @member {Rectangle} value
   */
});

RectangleParameter.prototype.formatValueAsString = function(value) {
  value = defaultValue(value, this.value);
  if (!defined(value)) {
    return "-";
  }

  var sw = Rectangle.southwest(value);
  var ne = Rectangle.northeast(value);

  var swlon = CesiumMath.toDegrees(sw.longitude),
    swlat = CesiumMath.toDegrees(sw.latitude),
    nelon = CesiumMath.toDegrees(ne.longitude),
    nelat = CesiumMath.toDegrees(ne.latitude);

  return (
    Math.abs(swlat).toFixed(2) +
    "°" +
    (swlat < 0 ? "S " : "N ") +
    Math.abs(swlon).toFixed(2) +
    "°" +
    (swlon < 0 ? "W" : "E") +
    " to " +
    Math.abs(nelat).toFixed(2) +
    "°" +
    (nelat < 0 ? "S " : "N ") +
    Math.abs(nelon).toFixed(2) +
    "°" +
    (nelon < 0 ? "W" : "E")
  );
};

RectangleParameter.prototype.getGeoJsonFeature = function(value) {
  value = defaultValue(value, this.value);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: rectangleToPolygonArray(value)
    }
  };
};

RectangleParameter.formatValueAsString =
  RectangleParameter.prototype.formatValueAsString;
RectangleParameter.getGeoJsonFeature =
  RectangleParameter.prototype.getGeoJsonFeature;
module.exports = RectangleParameter;
