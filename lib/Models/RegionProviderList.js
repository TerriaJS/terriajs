'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');
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
  RegionProviderList encapsulates the regionMapping.json file and provides support for choosing the best region
  provider for a given dataset.
*/

var RegionProviderList = function(terria) {
    /** 
     * URL pointing to a JSON file where the region provider definitions will be loaded from. 
     * @type {String}
     */
    this.url = terria.regionMappingDefinitionsUrl;

    /** 
     * List of RegionProviders, once loaded from file. 
     * @type {RegionProvider[]} 
     */
    this.regionProviders = [];

    /**
     * Has this list been initialized from file yet.
     * @type {Boolean}
     */
    this._initialized = false;

};

// Fetch JSON file and create ordered list of region providers from it. ReturnsPromise.
RegionProviderList.prototype.init = function() {
    if (this._initialized) {
        return when(true);
    }
    var that = this;
    return loadJson(this.url)
        .then(function(obj) {
            Object.keys(obj.regionWmsMap).forEach(function(r) {
                that.regionProviders.push(new RegionProvider(r, obj.regionWmsMap[r], that));
            });
            that._initialized = true;
        });
};

/* Find what kind of region-mapped dataset this is by exhaustively looking for every alias in every column. */
RegionProviderList.prototype.chooseRegionProvider = function (dataset) {
    if (!this._initialized) {
        throw new DeveloperError('Region provider list not initialized.');
    }
    var variables = dataset.getVariableNames()
        .map(function(vname) {
            return {
                name: vname,
                isTextCode: defined(dataset.getVariableEnumList(name))
            };
        });


    //try to figure out the region variable and type based on aliases
    var i;
    for (i = 0; i < this.regionProviders.length; i++) {
        var idx = this.regionProviders[i].findRegionVariable(variables);
        if (idx !== -1) {
            return { 
                regionProvider: this.regionProviders[i], 
                regionVariable: variables[idx].name /* ,
                disambigVariable: ...
                //## TODO
                */
            };
        }
    }

    return null;
};
/**
    Get the region provider matching a regionType string (eg, STE)
    @param {String} regionType The type string to look up.
    @return {Object} Region Provider, or null.
*/
RegionProviderList.prototype.getRegionProvider = function(regionType) {
    if (!this._initialized) {
        throw new DeveloperError('Region mapping list not initialized.');
    }
    var r = this.regionProviders.filter(function(p) { return p.regionType === regionType; });
    if (r.length > 1)
        throw new DeveloperError ('More than one definition of region provider: ' + regionType);
    if (r.length === 0)
        return null;
    return r[0];
};

module.exports = RegionProviderList;
