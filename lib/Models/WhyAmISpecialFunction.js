'use strict';

var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var WhyAmISpecialCatalogFunction = require('./WhyAmISpecialCatalogFunction');

deprecationWarning('WhyAmISpecialFunction', 'WhyAmISpecialFunction has been renamed to WhyAmISpecialCatalogFunction.  WhyAmISpecialFunction will be removed entirely in a future version.');
module.exports = WhyAmISpecialCatalogFunction;
