'use strict';

/*global require*/
var BooleanParameter = require('./BooleanParameter');
var CatalogFunction = require('./CatalogFunction');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var RegionDataParameter = require('./RegionDataParameter');
var RegionTypeParameter = require('./RegionTypeParameter');
var SpatialDetailingAsyncResultCatalogItem = require('./SpatialDetailingAsyncResultCatalogItem');

var SpatialDetailingFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = "Spatial Detailing";
    this.description = "Predicts the characteristics of fine-grained regions by learning and exploiting correlations of coarse-grained data with Census characteristics.";

    this._regionTypeToPredictParameter = new RegionTypeParameter({
        terria: this.terria,
        id: 'regionTypeToPredict',
        name: 'Region Type to Predict',
        description: 'The type of region for which to predict characteristics.'
    });

    this._coarseDataRegionTypeParameter = new RegionTypeParameter({
        terria: this.terria,
        id: 'coarseDataRegionType',
        name: 'Coarse Data Region Type',
        description: 'The type of region with which the coarse-grained input characteristics are associated.'
    });

    this._isMeanAggregationParameter = new BooleanParameter({
        terria: this.terria,
        id: 'isMeanAggregation',
        name: 'Is a Mean Aggregation',
        description: 'Specifies how coarse region values were aggregated.',
        trueName: 'Mean Aggregation',
        trueDescription: "Coarse region values are the mean of samples in the region.",
        falseName: 'Sum Aggregation',
        falseDescription: 'Coarse region values are the sum of samples in the region.',
        defaultValue: true
    });

    this._dataParameter = new RegionDataParameter({
        terria: this.terria,
        id: 'data',
        name: 'Characteristic to Predict',
        regionProvider: this._coarseDataRegionTypeParameter,
        singleSelect: true
    });

    this._parameters = [
        this._regionTypeToPredictParameter,
        this._coarseDataRegionTypeParameter,
        this._isMeanAggregationParameter,
        this._dataParameter
    ];
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
            return this._parameters;
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
    var value = this._dataParameter.getValue(parameters);

    var request = {
        algorithm: 'spatialdetailing',
        boundaries_name: parameters.coarseDataRegionType.regionType,
        region_codes: value.regionCodes,
        columns: value.columnHeadings[0],
        table: value.singleSelectValues,
        parameters: {
            disagg_boundaries_name: parameters.regionTypeToPredict.regionType,
            mean_agg: true
        }
    };

    var that = this;
    return loadWithXhr({
        url: this.url,
        method: 'POST',
        data: JSON.stringify(request)
    }).then(function(response) {
        var json = JSON.parse(response);
        var result = new SpatialDetailingAsyncResultCatalogItem(that, value.regionCodes, parameters, json.status_uri, json.uri);
        result.isEnabled = true;
    });
};

module.exports = SpatialDetailingFunction;
