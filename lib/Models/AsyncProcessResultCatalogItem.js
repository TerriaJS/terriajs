'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');

var AsyncProcessResultCatalogItem = function(terria) {
    CatalogItem.call(this, terria);
};

inherit(CatalogItem, AsyncProcessResultCatalogItem);

/**
 * Cancels the asynchronous process.
 */
AsyncProcessResultCatalogItem.prototype.cancel = function() {
};

AsyncProcessResultCatalogItem.prototype._enable = function() {
    // When load finishes, this item is replaced with the resulting item... or something
};

AsyncProcessResultCatalogItem.prototype._disable = function() {
};

AsyncProcessResultCatalogItem.prototype._show = function() {
};

AsyncProcessResultCatalogItem.prototype._hide = function() {
};

module.exports = AsyncProcessResultCatalogItem;
