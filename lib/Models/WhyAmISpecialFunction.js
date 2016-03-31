'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var extendLoad = require('./extendLoad');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var invokeTerriaAnalyticsService = require('./invokeTerriaAnalyticsService');
var TerriaError = require('../Core/TerriaError');
var RegionDataParameter = require('./RegionDataParameter');
var RegionParameter = require('./RegionParameter');
var RegionTypeParameter = require('./RegionTypeParameter');
// var updateRectangleFromRegion = require('./updateRectangleFromRegion');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var WhyAmISpecialFunction = function(terria) {
    CatalogFunction.call(this, terria);

    this.url = undefined;
    this.name = 'What makes this region unique or special?';
    this.description = 'Determines the characteristics by which a particular region is _most different_ from all other regions.';

    this._regionTypeParameter = new RegionTypeParameter({
        terria: this.terria,
        id: 'regionType',
        name: 'Region Type',
        description: 'The type of region to analyze.'
    });

    this._regionParameter = new RegionParameter({
        terria: this.terria,
        id: 'region',
        name: 'Region',
        description: 'The region to analyze.  The analysis will determine the characteristics by which this region is most different from all others.',
        regionProvider: this._regionTypeParameter
    });

    this._dataParameter = new RegionDataParameter({
        terria: this.terria,
        id: 'data',
        name: 'Characteristics',
        description: 'The region characteristics to include in the analysis.',
        regionProvider: this._regionTypeParameter
    });

    this._parameters = [
        this._regionTypeParameter,
        this._regionParameter,
        this._dataParameter
    ];
};

inherit(CatalogFunction, WhyAmISpecialFunction);

defineProperties(WhyAmISpecialFunction.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WhyAmISpecialFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'why-am-i-special-function';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Why Am I Special?'.
     * @memberOf WhyAmISpecialFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Why Am I Special?';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogProcess#invoke} to this function.
     * @memberOf WhyAmISpecialFunction
     * @type {CatalogProcessParameters[]}
     */
    parameters : {
        get : function() {
            return this._parameters;
        }
    }
});

WhyAmISpecialFunction.prototype.load = function() {
};

/**
 * Invokes the process.
 * @param {Object} parameters The parameters to the process.  Each required parameter in {@link CatalogProcess#parameters} must have a corresponding key in this object.
 * @return {AsyncProcessResultCatalogItem} The result of invoking this process.  Because the process typically proceeds asynchronously, the result is a temporary
 *         catalog item that resolves to the real one once the process finishes.
 */
WhyAmISpecialFunction.prototype.invoke = function(parameters) {
    var region = this._regionParameter.getValue(parameters);
    var data = this._dataParameter.getValue(parameters);

    if (!defined(region)) {
        throw new TerriaError({
            title: 'Region not selected',
            message: 'You must select a Region.'
        });
    }

    var request = {
        algorithm: 'whyamispecial',
        boundaries_name: parameters.regionType.regionType,
        region_codes: data.regionCodes,
        columns: data.columnHeadings,
        table: data.table,
        parameters: {
            query: region.id
        }
    };

    var regionProvider = parameters[this._regionTypeParameter.id];
    var regionIndex = regionProvider.regions.indexOf(region);

    var regionName = parameters.region.id;
    if (regionIndex >= 0) {
        regionName = regionProvider.regionNames[regionIndex] || regionName;
    }

    var name = 'Why is ' + regionName + ' special?';

    var geoJsonPromise = regionProvider.getRegionFeature(this.terria, region);
    var invocationPromise = invokeTerriaAnalyticsService(this.terria, name, this.url, request);

    var that = this;
    return when.all([geoJsonPromise, invocationPromise]).then(function(allResults) {
        var geoJson = allResults[0];
        var invocationResult = allResults[1];

        var result = invocationResult.result;

        var catalogItem = new GeoJsonCatalogItem(that.terria);
        catalogItem.name = name;
        catalogItem.data = geoJson;
        catalogItem.dataUrl = invocationResult.url;

        var description = 'This is the result of invoking "' + that.name + '" at ' + invocationResult.startDate + ' with these parameters:\n\n';
        description += ' * ' + parameters.regionType.regionType + ' Region: ' + regionName + ' (' + parameters.region.id + ')\n';
        description += ' * Characteristics: ' + data.columnHeadings.join(', ') + '\n';

        catalogItem.description = description;

        var shortReport = 'These are the top characteristics that make ' + regionName + ' unique or special:\n\n';

        var value;
        for (var i = 0; i < 5 && i < result.columns.length; ++i) {
            var columnName = data.columnHeadings[result.columns[i]];
            var histogram = result.histograms[i];
            var binCounts = histogram.bin_counts;
            var binEdges = histogram.bin_edges;

            var chartData = [['Value', 'Count']];

            for (var j = 0; j < binCounts.length; ++j) {
                var leftEdge = binEdges[j];
                var rightEdge = binEdges[j + 1];
                if (!defined(rightEdge)) {
                    // Assume equally-spaced bins.
                    rightEdge = leftEdge + (binEdges[1] - binEdges[0]);
                }

                var center = (leftEdge + rightEdge) * 0.5;

                if (result.values[i] >= leftEdge && result.values[i] <= rightEdge) {
                    value = center;
                }

                chartData.push([center, binCounts[j]]);
            }

            var percentile = result.percentiles[i];
            var percentileDescription = 'lower';
            if (percentile > 50) {
                percentile = 100 - percentile;
                percentileDescription = 'higher';
            }

            shortReport += '<collapsible title="' + columnName + '" open="' + (i === 0 ? 'true' : 'false') + '">\n\n';
            shortReport += 'The value of ' + columnName + ' in ' + regionName + ' is ' + result.values[i] + '.\n\n';
            shortReport += 'Only ' + percentile.toFixed(1) + '% of regions have an equal or ' + percentileDescription + ' value.';
            shortReport += '<chart source-data=\'' + JSON.stringify([chartData]) + '\' source-names="' + columnName + '" column-names="," y-column="1" styling="histogram" highlight-x="' + result.values[i] + '"></chart>\n\n';
            shortReport += '</collapsible>\n';
        }

        catalogItem.shortReport = shortReport;
        catalogItem.isEnabled = true;
    });
};

module.exports = WhyAmISpecialFunction;
