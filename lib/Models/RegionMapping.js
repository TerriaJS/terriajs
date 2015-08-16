'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var  RegionProvider = require('./RegionProvider');
/*
Responsibilities
- manage the regionMapping.json file
- find an appropriate RegionProvider
*/

var RegionMapping = function(terria) {
    this.url = terria.regionMappingDefinitionsUrl;

    this.regionProviders = [];

};
// Fetch JSON file and create ordered list of region providers from it. ReturnsPromise.
RegionMapping.prototype.init = function() {
    if (this.regionProviders.length > 0) {
        return when(true);
    }
    var that = this;
    var p = loadJson(this.url).then(function(obj) {
        Object.keys(obj.regionWmsMap).forEach(function(r) {
            that.regionProviders.push(new RegionProvider(r, obj.regionWmsMap[r]));
        });
    });
    return p;
};



/* Find what kind of region-mapped dataset this is by exhaustively looking for every alias in every column. */
RegionMapping.prototype.determineRegionType = function (dataset) {
    var variables = dataset.getVariableNames().map(function(vname) {
        return {
            name: vname,
            // ### Not sure this is really required, why not convert everything to string and be done with it?
            isTextCode: defined(dataset.getVariableEnumList(name))
        }
    });


    //try to figure out the region variable and type based on aliases
    var i;
    for (i = 0; i < this.regionProviders.length; i++) {
        var idx = this.regionProviders[i].findRegionVariable(variables);
        if (idx !== -1) {
            return { 
                regionProvider: this.regionProviders[i], 
                regionVariable: variables[idx].name 
            };
        }
    }

    return null;
};

module.exports = RegionMapping;


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
/* Not used currently 
var ausStates = { 
    'New South Wales': 1, 'NSW': 1, '1': 1,
    'Victoria': 2, 'Vic': 2, '2': 2,
    'Queensland': 3, 'QLD': 3, '3': 3,
    'South Australia': 4, 'SA': 4, '4': 4,
    'Western Australia': 5, 'WA': 5, '5': 5,
    'Northern Territory': 6, 'NT': 6, '6': 6,
    'Australian Capital Territory': 7, 'ACT': 7, '7': 7,
    'Other Territories': 8, '8': 8
};

*/
