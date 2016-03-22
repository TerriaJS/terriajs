'use strict';

/*global require*/
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var PlacesLikeMeFunction = require('./PlacesLikeMeFunction');
var SpatialDetailingFunction = require('./SpatialDetailingFunction');
//var WhyAmISpecialFunction = require('./WhyAmISpecialFunction');

var registerAnalytics = function() {
    createCatalogMemberFromType.register('places-like-me-function', PlacesLikeMeFunction);
    createCatalogMemberFromType.register('spatial-detailing-function', SpatialDetailingFunction);
    //createCatalogMemberFromType.register('why-am-i-special-function', WhyAmISpecialFunction);
};

module.exports = registerAnalytics;
