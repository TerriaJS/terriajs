'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var PlacesLikeMeAsyncResultCatalogItem = require('./PlacesLikeMeAsyncResultCatalogItem');

var PlacesLikeMeFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = "Regions like this";
    this.description = "Identifies regions that are _most like_ a given region according to a given set of characteristics.";
};

inherit(CatalogFunction, PlacesLikeMeFunction);

defineProperties(PlacesLikeMeFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf PlacesLikeMeFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'places-like-me-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Spatial Detailing'.
     * @memberOf PlacesLikeMeFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Places Like Me';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf PlacesLikeMeFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return [
                {
                    id: "regionType",
                    name: "Region Type",
                    description: "The type of region to analyze.",
                    type: "regionType"
                },
                {
                    id: "region",
                    name: "Region",
                    description: "The region to analyze.  The analysis will determine which regions are most similar to this one.",
                    type: "region",
                    regionType: {
                        parameter: "regionType"
                    }
                },
                {
                    id: "data",
                    name: "Characteristics",
                    description: "The region characteristics to include in the analysis.",
                    type: "regionData",
                    regionType: {
                        parameter: "regionType"
                    }
                }
            ];
        }
    }
});

/**
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogProcess#parameters} must have a corresponding key in this object.
 * @return {AsyncFunctionResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
PlacesLikeMeFunction.prototype.invoke = function(parameters) {
    var regionCodes = [];
    var regionCodeHash = {};
    var columns = [];

    var columnData;
    var regions;
    var values;
    var regionRow;

    for (var columnName in parameters.data) {
        if (parameters.data.hasOwnProperty(columnName)) {
            columnData = parameters.data[columnName];
            if (!columnData) {
                continue;
            }

            columns.push(columnName);

            regions = columnData.regions;
            values = columnData.values;

            for (var i = 0; i < regions.length; ++i) {
                regionRow = regionCodeHash[regions[i]];
                if (!defined(regionRow)) {
                    regionRow = regionCodeHash[regions[i]] = regionCodes.length;
                    regionCodes.push(regions[i]);
                }
            }
        }
    }

    var table = [];
    for (var columnIndex = 0; columnIndex < columns.length; ++columnIndex) {
        columnData = parameters.data[columns[columnIndex]];
        regions = columnData.regions;
        values = columnData.values;

        for (var rowIndex = 0; rowIndex < regionCodes.length; ++rowIndex) {
            regionRow = regionCodeHash[regions[rowIndex]];
            var row = table[regionRow];
            if (!defined(row)) {
                row = table[regionRow] = [];
            }
            row[columnIndex] = values[rowIndex] || 0.0; // TODO: don't replace nulls with 0.0
        }
    }

    var request = {
        algorithm: 'placeslikeme',
        boundaries_name: parameters.regionType,
        region_codes: regionCodes,
        columns: columns,
        table: table,
        parameters: {
            query: parameters.region
        }
    };

    var that = this;
    return loadWithXhr({
        url: this.url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        var json = JSON.parse(response);
        var result = new PlacesLikeMeAsyncResultCatalogItem(that, regionCodes, parameters, json.status_uri, json.uri);
        result.isEnabled = true;
    });
};

module.exports = PlacesLikeMeFunction;
