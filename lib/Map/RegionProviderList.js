'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var RegionProvider = require('./RegionProvider');

/**********************************************************************************************
*  Region mapping support - turn CSVs into choropleths of regions like local government areas
*  Implements most of http://terria.io/DataProviders/CSV-geo-au
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
*/
var RegionProviderList = function() {
/** 
 * List of RegionProviders, once loaded from file. 
 * @type {RegionProvider[]} 
 */
    this.regionProviders = [];

};
/* A static dictionary of promises to RegionProviderLists */
RegionProviderList.metaList = {};

/**
 * Returns a promise for a RegionProviderList instantiated from this url. Previous loads are cached.
 *
 * @param {String} url
 * @returns {Promise} A promise for a RegionProviderList instantiated from this url.
 */
RegionProviderList.fromUrl = function(url) {
   if (!defined(RegionProviderList.metaList[url])) {
        RegionProviderList.metaList[url] = loadJson(url)
            .then(function(o) { 
                return new RegionProviderList().initFromObject(o);
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
        that.regionProviders.push(new RegionProvider(r, obj.regionWmsMap[r]));
    });
    // after loading all providers, now we can set cross references for disambiguation, where required.
    Object.keys(obj.regionWmsMap).forEach(function(r) {
        var rp = that.getRegionProvider(r);
        if (obj.regionWmsMap[r].disambigRegionId) {
            rp.setDisambigProperties(that.getRegionProvider(obj.regionWmsMap[r].disambigRegionId));
        }
    });

    return this;
};


/**
 * Find what kind of region-mapped dataset this is by exhaustively looking for every alias in every column. 
 * 
 * @param varNames {String[]} Array of names of variables to choose amongst.
 * @return {Object} Object with regionProvider (RegionProvider), regionVariable and disambigVariable properties.
 */
RegionProviderList.prototype.chooseRegionProvider = function (varNames) {
    //try to figure out the region variable and type based on aliases
    var i;
    for (i = 0; i < this.regionProviders.length; i++) {
        var rv = this.regionProviders[i].findRegionVariable(varNames);
        if (rv) {
            return { 
                regionProvider: this.regionProviders[i], 
                regionVariable: rv,
                disambigVariable: this.regionProviders[i].findDisambigVariable(varNames),

            };
        }
    }

    return undefined;
};

/**
 * Get the region provider matching a regionType string (eg, STE)
 * 
 * @param {String} regionType The type string to look up.
 * @return {Object} Region Provider, or undefined.
 */
RegionProviderList.prototype.getRegionProvider = function(regionType) {
    var r = this.regionProviders.filter(function(p) { return p.regionType.toLowerCase() === regionType.toLowerCase(); });
    if (r.length > 1)
        throw new DeveloperError ('More than one definition of region provider: ' + regionType);
    if (r.length === 0)
        return undefined;
    return r[0];
};

module.exports = RegionProviderList;
