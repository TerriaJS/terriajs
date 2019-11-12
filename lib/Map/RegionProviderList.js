"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var loadJson = require("../Core/loadJson");
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var RegionProvider = require("./RegionProvider");

/**********************************************************************************************
*  Region mapping support - turn CSVs into choropleths of regions like local government areas
*  Implements most of https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au
*  How this works:
*  1. If there are 'lat' and 'lon' columns, use those instead to generate a point display.
*  2. Look through all the column names in the CSV file until we find one that matches a defined region descriptor in
      region mapping JSON file (not included in TerriaJS)
*  3. Contact the WFS server defined in that file, fetch IDs for all regions of that type
*  4. Based on values in the region variable column, generate a linear choropleth mapping
*  5. Fetch specially prepared WMS tiles which are coloured with a unique colour per region.
*  6. Recolor each tile, using the unique colour to determine its ID, then replacing that unique colour with a mapped color.
*
* Voilà - very fast client-side choroplething with no user data sent to servers, and no vector boundaries sent to client. */

/**
 * RegionProviderList encapsulates the regionMapping.json file and provides support for choosing the best region
 * provider for a given dataset.
 *
 * @alias RegionProviderList
 * @constructor
 * @param corsProxy A proxy to allow the region providers to make AJAX calls safely.
 */
var RegionProviderList = function(corsProxy) {
  /**
   * List of RegionProviders, once loaded from file.
   * @type {RegionProvider[]}
   */
  this.regionProviders = [];

  // To be passed to new RegionProviders
  this.corsProxy = corsProxy;
};

/* A static dictionary of promises to RegionProviderLists */
RegionProviderList.metaList = {};

/**
 * Returns a promise for a RegionProviderList instantiated from this url. Previous loads are cached.
 *
 * @param {String} url
 * @returns {Promise} A promise for a RegionProviderList instantiated from this url.
 */
RegionProviderList.fromUrl = function(url, corsProxy) {
  if (!defined(RegionProviderList.metaList[url])) {
    RegionProviderList.metaList[url] = loadJson(url).then(function(o) {
      return new RegionProviderList(corsProxy).initFromObject(o);
    });
  }
  return RegionProviderList.metaList[url];
};

/**
 * Initialises from the already-retrieved contents of a JSON file.
 *
 * @param {Object} obj
 */
RegionProviderList.prototype.initFromObject = function(obj) {
  var that = this;
  Object.keys(obj.regionWmsMap).forEach(function(r) {
    that.regionProviders.push(
      new RegionProvider(r, obj.regionWmsMap[r], that.corsProxy)
    );
  });
  // after loading all providers, now we can set cross references for disambiguation, where required.
  Object.keys(obj.regionWmsMap).forEach(function(r) {
    var rp = that.getRegionProvider(r);
    if (obj.regionWmsMap[r].disambigRegionId) {
      rp.setDisambigProperties(
        that.getRegionProvider(obj.regionWmsMap[r].disambigRegionId)
      );
    }
  });
  return this;
};

/**
 * Find what kind of region-mapped dataset this is by exhaustively looking for every alias for every variable name provided.
 * You can optionally provide a prefered region variable name, and optionally its prefered type.
 * If specified, getRegionDetails will return that name as the first object in the returned array.
 *
 * @param variableNames {String[]} Array of names of variables to choose amongst.
 * @param variableNames {String[]} Array of names of variables to choose amongst.
 * @return {Object[]} An array of objects with regionProvider (RegionProvider), regionVariable and disambigVariable properties, for each potential region variable in the list of names.
 */
RegionProviderList.prototype.getRegionDetails = function(
  variableNames,
  preferedRegionVariableName,
  preferedRegionType
) {
  var results = [];
  // If preferedRegionVariableName is in variableNames (which it must be to be meaningful; if undefined, it won't be), remove it first.
  var index = variableNames.indexOf(preferedRegionVariableName);
  if (index >= 0) {
    variableNames = variableNames.slice(); // clone it so we don't potentially confuse the caller.
    variableNames.splice(index, 1);
    if (!defined(preferedRegionType)) {
      // If no type is provided, simply put this back in the front of the array, to prioritize it.
      variableNames.unshift(preferedRegionVariableName);
    } else {
      // If a type is provided, handle it specially.
      var regionProvider = this.getRegionProvider(preferedRegionType);
      results.push({
        regionProvider: regionProvider,
        variableName: preferedRegionVariableName,
        disambigVariableName: regionProvider.findDisambigVariable(variableNames)
      });
    }
  }
  // Figure out the region variable and type based on aliases.
  for (var i = 0; i < this.regionProviders.length; i++) {
    var rv = this.regionProviders[i].findRegionVariable(variableNames);
    if (rv) {
      results.push({
        regionProvider: this.regionProviders[i],
        variableName: rv,
        disambigVariableName: this.regionProviders[i].findDisambigVariable(
          variableNames
        )
      });
    }
  }
  return results;
};

/**
 * Get the region provider matching a regionType string (eg, STE)
 *
 * @param {String} regionType The type string to look up.
 * @return {RegionProvider} The region provider matching a regionType string (eg, STE), or undefined.
 */
RegionProviderList.prototype.getRegionProvider = function(regionType) {
  var r = this.regionProviders.filter(function(p) {
    return p.regionType.toLowerCase() === regionType.toLowerCase();
  });
  if (r.length > 1) {
    throw new DeveloperError(
      "More than one definition of region provider: " + regionType
    );
  }
  if (r.length === 0) {
    return undefined;
  }
  return r[0];
};

module.exports = RegionProviderList;
