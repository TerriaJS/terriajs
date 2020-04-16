"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var RegionTypeParameter = require("../Models/RegionTypeParameter");

/**
 * A parameter that specifies a particular region.
 *
 * @alias RegionParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {RegionProvider|RegionTypeParameter} options.regionProvider The {@link RegionProvider} from which a region may be selected.  This may also
 *                                                                    be a {@link RegionTypeParameter} that specifies the type of region.
 */
var RegionParameter = function(options) {
  if (!defined(options) || !defined(options.regionProvider)) {
    throw new DeveloperError("options.regionProvider is required.");
  }

  FunctionParameter.call(this, options);

  this._regionProvider = options.regionProvider;
};

inherit(FunctionParameter, RegionParameter);

Object.defineProperties(RegionParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof RegionParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "region";
    }
  },

  /**
   * Gets or sets the value of this parameter.  The value is an actual region, i.e. from
   * {@link RegionProvider#regions}.  However, it may be set as a string, in which case
   * a string is treated as the ID of a region and the actual region object is looked up
   * with the region provider.
   * @memberof RegionParameter.prototype
   * @member {Object} value
   */
  value: {
    get: FunctionParameter.defaultValueGetter,
    set: function(value) {
      if (typeof value === "string" || typeof value === "number") {
        value = this.findRegionByID(value);
      }
      FunctionParameter.defaultValueSetter.call(this, value);
    }
  },

  /**
   * Gets the region provider indicating the type of region that this property holds data for.
   * @memberof RegionParameter.prototype
   * @type {RegionProvider}
   */
  regionProvider: {
    get: function() {
      return RegionTypeParameter.resolveRegionProvider(this._regionProvider);
    }
  },

  /**
   * Gets the {@link RegionTypeParameter} that specifies the type of region, if it exists.
   * @memberof RegionParameter.prototype
   * @type {RegionTypeParameter}
   */
  regionTypeParameter: {
    get: function() {
      if (this._regionProvider instanceof RegionTypeParameter) {
        return this._regionProvider;
      }
      return undefined;
    }
  }
});

/**
 * Finds a region with a given region ID.
 *
 * @param {String} regionID The ID of the region to find.
 * @return {Region} The region, or undefined if no region matching the ID was found.
 */
RegionParameter.prototype.findRegionByID = function(regionID) {
  var regionProvider = this.regionProvider;

  if (
    typeof regionID === "string" &&
    regionProvider.regions[0] &&
    typeof regionProvider.regions[0].id === "number"
  ) {
    regionID = parseInt(regionID, 10);
  } else if (typeof regionID === "string") {
    regionID = regionID.toLowerCase();
    var replacedValue =
      regionProvider._appliedReplacements.serverReplacements[regionID];
    if (defined(replacedValue)) {
      regionID = replacedValue;
    }
  }

  return regionProvider.regions.filter(function(region) {
    return region.id === regionID;
  })[0];
};

module.exports = RegionParameter;
