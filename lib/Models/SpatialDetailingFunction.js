'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');

var SpatialDetailingFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = "Spatial Detailing";
    this.description = "Predicts the characteristics of fine-grained regions by learning and exploiting correlations of coarse-grained data with Census characteristics.";
};

inherit(CatalogFunction, SpatialDetailingFunction);

defineProperties(SpatialDetailingFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf SpatialDetailingFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'spatial-detailing-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Spatial Detailing'.
     * @memberOf SpatialDetailingFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Spatial Detailing';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf SpatialDetailingFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return [
                {
                    id: "regionTypeToPredict",
                    name: "Region Type to Predict",
                    description: "The type of region for which to predict characteristics.",
                    type: "regionType"
                },
                {
                    id: "coarseDataRegionType",
                    name: "Coarse Data Region Type",
                    description: "The type of region with which the coarse-grained input characteristics are associated.",
                    type: "regionType"
                },
                {
                    id: "data",
                    name: "Coarse Data Characteristics",
                    description: "The coarse data from which to predict the characteristics of fine-grained regions.",
                    type: "regionData",
                    regionType: {
                        parameter: "coarseDataRegionType"
                    }
                }
            ];
        }
    }
});

/**
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogProcess#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
SpatialDetailingFunction.prototype.invoke = function(parameters) {
    var regionCodes = [];
    var regionCodeHash = {};
    var columns = [];

    var columnData;
    var regions;
    var values;
    var regionRow;

    for (var columnName in parameters.data) {
        if (parameters.data.hasOwnProperty(columnName)) {
            columns.push(columnName);

            columnData = parameters.data[columnName];
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
        algorithm: 'spatialdetailing',
        boundaries_name: parameters.coarseDataRegionType,
        region_codes: regionCodes,
        columns: columns,
        table: table,
        parameters: {
            disagg_boundaries_name: parameters.regionTypeToPredict,
            mean_agg: true
        }
    };

    return loadWithXhr({
        url: this.url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        console.log(response);
    });
};

module.exports = SpatialDetailingFunction;
