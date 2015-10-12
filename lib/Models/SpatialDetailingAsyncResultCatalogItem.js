'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
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

    this.name = 'Spatial detailing of ' + predictedCharacteristic + ' at ' + parameters['regionTypeToPredict']; // TODO: use the name of the region instead of its ID.
    this.statusUri = statusUri;
    this.jobUri = jobUri;

    var that = this;

    function requestStatus() {
        return loadJson(statusUri).then(function(statusResult) {
            if (statusResult.queueing_status !== 'finished') {
                // Try again in 1 second.
                setTimeout(requestStatus, 1000);
                return;
            }

            // TODO: fix the error handling.  The exception thrown below will disappear silently.

            // Finished!
            return loadJson(jobUri).then(function(result) {
                var csv = parameters['regionTypeToPredict'] + ',' + predictedCharacteristic + '\n';

                var predictedValues = result.disagg_mean;
                var predictedRegions = result.disagg_regions;
                if (predictedValues.length !== predictedRegions.length) {
                    throw new RuntimeError('The list of values and the list of region codes do not contain the same number of elements.');
                }

                for (var i = 0; i < predictedRegions.length; ++i) {
                    csv += predictedRegions[i] + ',' + predictedValues[i] + '\n';
                }

                var catalogItem = new CsvCatalogItem(that.terria);
                catalogItem.name = that.name;
                catalogItem.data = csv;
                catalogItem.isEnabled = true;
                that.isEnabled = false;
            });
        });
    }

    requestStatus();
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
