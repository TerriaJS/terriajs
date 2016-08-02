'use strict';

/*global require*/
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');

deprecationWarning('AsyncFunctionResultCatalogItem', 'AsyncFunctionResultCatalogItem has been renamed to ResultPendingCatalogItem.  AsyncFunctionResultCatalogItem will be removed entirely in a future version.')
module.exports = ResultPendingCatalogItem;
