'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');

var PlacesLikeMeAsyncResultCatalogItem = function(catalogFunction, regionCodes, parameters, statusUri, jobUri) {
    CatalogItem.call(this, catalogFunction.terria);

    this.name = 'Places like ' + parameters['region']; // TODO: use the name of the region instead of its ID.
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
                var csv = parameters['regionType'] + ',Likeness\n';

                var likeness = result.likeness;
                if (regionCodes.length !== likeness.length) {
                    throw new RuntimeError('The list of likenesses and the list of region codes do not contain the same number of elements.');
                }

                for (var i = 0; i < regionCodes.length; ++i) {
                    csv += regionCodes[i] + ',' + likeness[i] + '\n';
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

inherit(CatalogItem, PlacesLikeMeAsyncResultCatalogItem);

defineProperties(PlacesLikeMeAsyncResultCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'places-like-me-async-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Places Like Me';
        }
    }
});

/**
 * Cancels the asynchronous process.
 */
PlacesLikeMeAsyncResultCatalogItem.prototype.cancel = function() {
};

PlacesLikeMeAsyncResultCatalogItem.prototype._enable = function() {
    // When load finishes, this item is replaced with the resulting item... or something
};

PlacesLikeMeAsyncResultCatalogItem.prototype._disable = function() {
};

PlacesLikeMeAsyncResultCatalogItem.prototype._show = function() {
};

PlacesLikeMeAsyncResultCatalogItem.prototype._hide = function() {
};

module.exports = PlacesLikeMeAsyncResultCatalogItem;
