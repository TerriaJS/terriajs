"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var PointParameter = require("./PointParameter");
var PolygonParameter = require("./PolygonParameter");
var SelectAPolygonParameter = require("./SelectAPolygonParameter");

/**
 * A parameter that specifies an arbitrary polygon on the globe.
 *
 * @alias GeoJsonParameter
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
var GeoJsonParameter = function(options) {
  FunctionParameter.call(this, options);
  this.regionParameter = options.regionParameter;
  this.value = "";
  this._subtype = undefined;
};

inherit(FunctionParameter, GeoJsonParameter);

Object.defineProperties(GeoJsonParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof GeoJsonParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "geojson";
    }
  },

  /**
   * Gets the RegionTypeParameter.
   * @memberof GeoJsonParameter.prototype
   * @type {RegionTypeParameter}
   */
  regionTypeParameter: {
    get: function() {
      return this.regionParameter.regionTypeParameter;
    }
  },

  /**
   * Gets the RegionProvider.
   * @memberof GeoJsonParameter.prototype
   * @type {RegionProvider}
   */
  regionProvider: {
    get: function() {
      return this.regionParameter.regionProvider;
    }
  },

  /**
   * Get the subtype of this parameter.
   * @memberof GeoJsonParameter.prototype
   * @type {String}
   */
  subType: {
    get: function() {
      return this._subtype;
    },
    set: function(value) {
      this._subtype = value;
    }
  }
});

GeoJsonParameter.prototype.findRegionByID = function(regionId) {
  return this.regionParameter.findRegionByID(regionId);
};

GeoJsonParameter.prototype._load = function() {
  return this.regionParameter.regionTypeParameter._load();
};

/**
 * Represents value as string.
 * @param {Object} value Value to format as string.
 * @return {String} String representing value.
 */
GeoJsonParameter.prototype.formatValueAsString = function(value) {
  if (!defined(value) || value === "") {
    return "-";
  }
  if (this.subtype === GeoJsonParameter.PointType) {
    return PointParameter.formatValueAsString(value);
  }
  if (this.subtype === GeoJsonParameter.SelectAPolygonType) {
    return SelectAPolygonParameter.formatValueAsString(value);
  }
  if (this.subtype === GeoJsonParameter.PolygonType) {
    return PolygonParameter.formatValueAsString(value);
  }
  var index = this.regionParameter.regionProvider.regions.indexOf(value);

  if (index >= 0 && this.regionParameter.regionProvider.regionNames[index]) {
    value = this.regionParameter.regionProvider.regionNames[index];
  } else {
    value = value.id;
  }
  return this.regionParameter.regionProvider.regionType + ": " + value;
};

/**
 * Get feature as geojson for display on map.
 * @param {Object} value Value to use.
 * @return GeoJson object.
 */
GeoJsonParameter.prototype.getGeoJsonFeature = function(value) {
  if (this.subtype === GeoJsonParameter.PointType) {
    return PointParameter.getGeoJsonFeature(value);
  }
  if (this.subtype === GeoJsonParameter.SelectAPolygonType) {
    return SelectAPolygonParameter.getGeoJsonFeature(value);
  }
  if (this.subtype === GeoJsonParameter.PolygonType) {
    return PolygonParameter.getGeoJsonFeature(value);
  }
  return this.regionParameter.regionProvider
    .getRegionFeature(this._terria, value, undefined)
    .then(function(feature) {
      var geojson = {
        type: "Feature",
        geometry: feature.geometry
      };
      return geojson;
    });
};

/**
 * Return representation of value as URL argument.
 * @param {Object} value Value to use.
 * @return {String} parameter as key=value.
 */
GeoJsonParameter.prototype.getProcessedValue = function(value) {
  if (this.subtype === GeoJsonParameter.PointType) {
    return {
      inputType: "ComplexData",
      inputValue: PointParameter.formatValueForUrl(value, this)
    };
  }
  if (this.subtype === GeoJsonParameter.SelectAPolygonType) {
    return {
      inputType: "ComplexData",
      inputValue: SelectAPolygonParameter.formatValueForUrl(value, this)
    };
  }
  if (this.subtype === GeoJsonParameter.PolygonType) {
    return {
      inputType: "ComplexData",
      inputValue: PolygonParameter.formatValueForUrl(value, this)
    };
  }

  var multiPolStr = this.regionParameter.regionProvider
    .getRegionFeature(this._terria, value, undefined)
    .then(function(feature) {
      var regionParameterString = JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: feature.geometry
          }
        ]
      });
      return regionParameterString;
    });
  return {
    inputType: "ComplexData",
    inputValue: multiPolStr
  };
};

GeoJsonParameter.PointType = "point";
GeoJsonParameter.PolygonType = "polygon";
GeoJsonParameter.RegionType = "region";
GeoJsonParameter.SelectAPolygonType = "selectAPolygon";

module.exports = GeoJsonParameter;
