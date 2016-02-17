'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var AsyncFunctionResultCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this.loadPromise = undefined;
    this.loadingMessage = undefined;
    this.isFailed = false;
    this.failedMessage = undefined;
    this.moreFailureDetailsAvailable = false;

    knockout.track(this, ['loadingMessage', 'isFailed', 'failedMessage', 'moreFailureDetailsAvailable']);
};

inherit(CatalogItem, AsyncFunctionResultCatalogItem);

defineProperties(AsyncFunctionResultCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AsyncFunctionResultCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'async-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf AsyncFunctionResultCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Analysis in Progress';
        }
    }
});

AsyncFunctionResultCatalogItem.prototype._load = function() {
    return this.loadPromise;
};

/**
 * Cancels the asynchronous process.
 */
AsyncFunctionResultCatalogItem.prototype.cancel = function() {
};

AsyncFunctionResultCatalogItem.prototype._enable = function() {
};

AsyncFunctionResultCatalogItem.prototype._disable = function() {
};

AsyncFunctionResultCatalogItem.prototype._show = function() {
};

AsyncFunctionResultCatalogItem.prototype._hide = function() {
};

module.exports = AsyncFunctionResultCatalogItem;
