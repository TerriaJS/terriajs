"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var overrideProperty = require("../Core/overrideProperty");

var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");
var RegionProvider = require("../Map/RegionProvider");
var RegionProviderList = require("../Map/RegionProviderList");

/**
 * A parameter that specifies a type of region.
 *
 * @alias RegionTypeParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {String[]} [options.validRegionTypes] The region types from which this RegionTypeParameter selects.  If this parameter is not specified, all region types
 *                                              known to {@link Terria} may be selected.
 */
var RegionTypeParameter = function(options) {
  FunctionParameter.call(this, options);

  this._regionProviderPromise = undefined;
  this._regionProviderList = undefined;

  this.validRegionTypes = options.validRegionTypes;

  // Track this so that defaultValue can update once regionProviderList is known.
  knockout.track(this, ["_regionProviderList"]);

  /**
   * Gets the default region provider if the user has not specified one.  If region-mapped data
   * is loaded on the map, this property returns the {@link RegionProvider} of the topmost
   * region-mapped catalog item.  Otherwise, it returns the first region provider.  If the
   * parameter has not yet been loaded, this property returns undefined.
   * @memberof RegionTypeParameter.prototype
   * @type {RegionProvider}
   */
  overrideProperty(this, "defaultValue", {
    get: function() {
      if (defined(this._defaultValue)) {
        return this._defaultValue;
      }

      const nowViewingItems = this.terria.nowViewing.items;
      if (nowViewingItems.length > 0) {
        for (let i = 0; i < nowViewingItems.length; ++i) {
          const item = nowViewingItems[i];
          if (
            defined(item.regionMapping) &&
            defined(item.regionMapping.regionDetails) &&
            item.regionMapping.regionDetails.length > 0
          ) {
            return item.regionMapping.regionDetails[0].regionProvider;
          }
        }
      }
      if (
        defined(this._regionProviderList) &&
        this._regionProviderList.length > 0
      ) {
        return this._regionProviderList[0];
      }

      // No defaults available; have we requested the region providers yet?
      this.load();
      return undefined;
    }
  });
};

/**
 * Resolves value that may be either a {@link RegionProvider} or a {@link RegionTypeParameter}
 * to a {@link RegionProvider}.
 * @param {RegionProvider|RegionTypeParameter} regionProviderOrParameter The region provider or parameter.
 * @return {RegionProvider} If `regionProviderOrParameter` is a {@link RegionProvider}, that value is returned.  If it is a
 *         {@link RegionTypeParameter}, the value of the parameter is returned.
 *         The return value may be undefined if `regionProviderOrParameter` is undefined, or if the value of the
 *         region type parameter is undefined.
 */
RegionTypeParameter.resolveRegionProvider = function(
  regionProviderOrParameter
) {
  if (regionProviderOrParameter instanceof RegionProvider) {
    return regionProviderOrParameter;
  } else if (regionProviderOrParameter instanceof RegionTypeParameter) {
    return regionProviderOrParameter.value;
  } else {
    return undefined;
  }
};

inherit(FunctionParameter, RegionTypeParameter);

Object.defineProperties(RegionTypeParameter.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof RegionTypeParameter.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "regionType";
    }
  }

  /**
   * Gets or sets the value of this parameter.
   * @memberof RegionTypeParameter.prototype
   * @member {RegionProvider} value
   */
});

RegionTypeParameter.prototype._load = function() {
  return this.getAllRegionTypes();
};

/**
 * Gets all list of region types that may be selected for this parameter.
 * Also caches the promise in this._regionProviderPromise, and the promise result in
 * this._regionProviderList.
 * @return {Promise.<RegionProvider[]>} [description]
 */
RegionTypeParameter.prototype.getAllRegionTypes = function() {
  var that = this;
  if (defined(this._regionProviderPromise)) {
    return this._regionProviderPromise;
  }
  this._regionProviderPromise = RegionProviderList.fromUrl(
    this.terria.configParameters.regionMappingDefinitionsUrl,
    this.terria.corsProxy
  ).then(function(regionProviderList) {
    var result;
    if (!defined(that.validRegionTypes)) {
      result = regionProviderList.regionProviders;
    } else {
      result = regionProviderList.regionProviders.filter(function(
        regionProvider
      ) {
        return that.validRegionTypes.indexOf(regionProvider.regionType) >= 0;
      });
    }
    // Filter out region types that don't have a WMS server associated (e.g. those that are purely vector tile)
    result = result.filter(function(regionProvider) {
      return defined(regionProvider.analyticsWmsServer);
    });
    that._regionProviderList = result;
    return result;
  });
  return this._regionProviderPromise;
};

module.exports = RegionTypeParameter;
