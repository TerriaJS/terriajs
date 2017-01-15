'use strict';

var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var PlacesLikeMeCatalogFunction = require('./PlacesLikeMeCatalogFunction');

deprecationWarning('PlacesLikeMeFunction', 'PlacesLikeMeFunction has been renamed to PlacesLikeMeCatalogFunction.  PlacesLikeMeFunction will be removed entirely in a future version.');
module.exports = PlacesLikeMeCatalogFunction;
