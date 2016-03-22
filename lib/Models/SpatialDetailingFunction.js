'use strict';

/*global require*/
var BooleanParameter = require('./BooleanParameter');
var CatalogFunction = require('./CatalogFunction');
var CsvCatalogItem = require('./CsvCatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var invokeTerriaAnalyticsService = require('./invokeTerriaAnalyticsService');
var RegionDataParameter = require('./RegionDataParameter');
var RegionTypeParameter = require('./RegionTypeParameter');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');

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
        description: 'Specifies how coarse region values were aggregated.  True if the value is the mean of the values across the region, or False if the value is the sum of the values across the region.',
        trueName: 'Mean Aggregation',
        trueDescription: "Coarse region values are the mean of samples in the region.  For example, average household income.",
        falseName: 'Sum Aggregation',
        falseDescription: 'Coarse region values are the sum of samples in the region.  For example, total population.',
        defaultValue: true
    });

    this._dataParameter = new RegionDataParameter({
        terria: this.terria,
        id: 'data',
        name: 'Characteristic to Predict',
        description: 'The characteristic to predict for each region.',
        regionProvider: this._coarseDataRegionTypeParameter,
        singleSelect: true
    });

    this._parameters = [
        this._coarseDataRegionTypeParameter,
        this._regionTypeToPredictParameter,
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

SpatialDetailingFunction.prototype.load = function() {
};

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
            mean_agg: parameters[this._isMeanAggregationParameter.id]
        }
    };

    var predictedCharacteristic;
    for (var characteristicName in parameters.data) {
        if (parameters.data.hasOwnProperty(characteristicName) && parameters.data[characteristicName]) {
            predictedCharacteristic = characteristicName;
            break;
        }
    }

    var name = 'Spatial detailing of ' + value.columnHeadings[0] + ' at ' + parameters.regionTypeToPredict.regionType;

    var that = this;
    return invokeTerriaAnalyticsService(this.terria, name, this.url, request).then(function(invocationResult) {
        var result = invocationResult.result;

        var csv = parameters['regionTypeToPredict'].regionType + ',Predicted ' + predictedCharacteristic + ' (Quality: ' + result.Quality + '),Lower bound of 95% confidence interval,Upper bound of 95% confidence interval\n';

        var predictedValues = result.disagg_mean;
        var predictedRegions = result.disagg_regions;
        var confidenceUpper = result.disagg_95conf_upper;
        var confidenceLower = result.disagg_95conf_lower;

        if (predictedValues.length !== predictedRegions.length) {
            throw new RuntimeError('The list of values and the list of region codes do not contain the same number of elements.');
        }

        for (var i = 0; i < predictedRegions.length; ++i) {
            csv += predictedRegions[i] + ',' + predictedValues[i] + ',' + confidenceLower[i] + ',' + confidenceUpper[i] + '\n';
        }

        var catalogItem = new CsvCatalogItem(that.terria);
        catalogItem.name = name;
        catalogItem.data = csv;
        catalogItem.dataUrl = invocationResult.url;

        var description = 'This is the result of invoking "' + that.name + '" at ' + invocationResult.startDate + ' with these parameters:\n\n';
        description += ' * Region type to predict: ' + parameters.regionTypeToPredict.regionType + '\n';
        description += ' * Coarse data region type: ' + parameters.coarseDataRegionType.regionType + '\n';

        if (parameters.isMeanAggregation) {
            description += ' * Treat values as a mean aggregation.\n';
        } else {
            description += ' * Treat values as a sum aggregation.\n';
        }

        description += ' * Predicted characteristic: ' + value.columnHeadings[0] + '\n';

        catalogItem.description = description;

        return catalogItem.loadAndEnable();
    });
};

module.exports = SpatialDetailingFunction;
