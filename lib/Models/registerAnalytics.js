'use strict';

/*global require*/
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var PlacesLikeMeCatalogFunction = require('./PlacesLikeMeCatalogFunction');
var SpatialDetailingCatalogFunction = require('./SpatialDetailingCatalogFunction');
var WhyAmISpecialCatalogFunction = require('./WhyAmISpecialCatalogFunction');

var registerAnalytics = function() {
    createCatalogMemberFromType.register('places-like-me-function', PlacesLikeMeCatalogFunction);
    createCatalogMemberFromType.register('spatial-detailing-function', SpatialDetailingCatalogFunction);
    createCatalogMemberFromType.register('why-am-i-special-function', WhyAmISpecialCatalogFunction);
};

module.exports = registerAnalytics;
