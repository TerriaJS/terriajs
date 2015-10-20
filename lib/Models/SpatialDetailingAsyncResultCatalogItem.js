'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var runLater = require('../Core/runLater');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');

var SpatialDetailingAsyncResultCatalogItem = function(catalogFunction, regionCodes, parameters, statusUri, jobUri) {
    CatalogItem.call(this, catalogFunction.terria);

    var predictedCharacteristic;
    for (var characteristicName in parameters.data) {
        if (parameters.data.hasOwnProperty(characteristicName) && parameters.data[characteristicName]) {
            predictedCharacteristic = characteristicName;
            break;
        }
    }

    this.predictedCharacteristic = predictedCharacteristic;
    this.name = 'Spatial detailing of ' + predictedCharacteristic + ' at ' + parameters['regionTypeToPredict'].regionType;
    this.parameters = parameters;
    this.statusUri = statusUri;
    this.jobUri = jobUri;
};

inherit(CatalogItem, SpatialDetailingAsyncResultCatalogItem);

defineProperties(SpatialDetailingAsyncResultCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'spatial-detailing-async-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Spatial Detailing';
        }
    }
});

SpatialDetailingAsyncResultCatalogItem.prototype._load = function() {
    var that = this;

    function requestStatus() {
        return loadJson(that.statusUri).then(function(statusResult) {
            if (statusResult.queueing_status !== 'finished') {
                // Try again in 1 second.
                return runLater(requestStatus, 1000);
            }

            // TODO: fix the error handling.  The exception thrown below will disappear silently.

            // Finished!
            return loadJson(that.jobUri).then(function(result) {
                var csv = that.parameters['regionTypeToPredict'].regionType + ',Predicted ' + that.predictedCharacteristic + ',95% confidence interval\n';

                var predictedValues = result.disagg_mean;
                var predictedRegions = result.disagg_regions;
                var confidenceUpper = result.disagg_95conf_upper;
                var confidenceLower = result.disagg_95conf_lower;

                if (predictedValues.length !== predictedRegions.length) {
                    throw new RuntimeError('The list of values and the list of region codes do not contain the same number of elements.');
                }

                for (var i = 0; i < predictedRegions.length; ++i) {
                    csv += predictedRegions[i] + ',' + predictedValues[i] + ',' + confidenceLower[i] + ' - ' + confidenceUpper[i] + '\n';
                }

                var catalogItem = new CsvCatalogItem(that.terria);
                catalogItem.name = that.name;
                catalogItem.data = csv;
                catalogItem.isEnabled = true;
                that.isEnabled = false;
            });
        });
    }

    return requestStatus();
};

/**
 * Cancels the asynchronous process.
 */
SpatialDetailingAsyncResultCatalogItem.prototype.cancel = function() {
};

SpatialDetailingAsyncResultCatalogItem.prototype._enable = function() {
    // When load finishes, this item is replaced with the resulting item... or something
};

SpatialDetailingAsyncResultCatalogItem.prototype._disable = function() {
};

SpatialDetailingAsyncResultCatalogItem.prototype._show = function() {
};

SpatialDetailingAsyncResultCatalogItem.prototype._hide = function() {
};

module.exports = SpatialDetailingAsyncResultCatalogItem;
