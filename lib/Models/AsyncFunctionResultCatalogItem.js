'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');

var AsyncFunctionResultCatalogItem = function(terria) {
    CatalogItem.call(this, terria);
};

inherit(CatalogItem, AsyncFunctionResultCatalogItem);

/**
 * Cancels the asynchronous process.
 */
AsyncFunctionResultCatalogItem.prototype.cancel = function() {
};

AsyncFunctionResultCatalogItem.prototype._enable = function() {
    // When load finishes, this item is replaced with the resulting item... or something
};

AsyncFunctionResultCatalogItem.prototype._disable = function() {
};

AsyncFunctionResultCatalogItem.prototype._show = function() {
};

AsyncFunctionResultCatalogItem.prototype._hide = function() {
};

module.exports = AsyncFunctionResultCatalogItem;
