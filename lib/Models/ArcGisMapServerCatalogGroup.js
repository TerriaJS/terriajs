'use strict';

var ArcGisCatalogGroup = require('./ArcGisCatalogGroup');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');

deprecationWarning('ArcGisMapServerCatalogGroup', 'ArcGisMapServerCatalogGroup has been deprecated.  Please use ArcGisCatalogGroup instead.');
module.exports = ArcGisCatalogGroup;