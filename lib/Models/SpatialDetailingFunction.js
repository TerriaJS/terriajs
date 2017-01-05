'use strict';

var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var SpatialDetailingCatalogFunction = require('./SpatialDetailingCatalogFunction');

deprecationWarning('SpatialDetailingFunction', 'SpatialDetailingFunction has been renamed to SpatialDetailingCatalogFunction.  SpatialDetailingFunction will be removed entirely in a future version.');
module.exports = SpatialDetailingCatalogFunction;
