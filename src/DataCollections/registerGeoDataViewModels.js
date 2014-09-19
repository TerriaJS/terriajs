'use strict';

/*global require*/

var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var CzmlDataSourceViewModel = require('./CzmlDataSourceViewModel');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var WebMapServiceDataSourceViewModel = require('./WebMapServiceDataSourceViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');

var registerGeoDataViewModel = function() {
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('czml', CzmlDataSourceViewModel);
    createGeoDataItemFromType.register('wms', WebMapServiceDataSourceViewModel);
    createGeoDataItemFromType.register('wms-getCapabilities', WebMapServiceGroupViewModel);
};

module.exports = registerGeoDataViewModel;
