'use strict';

/*global require*/

var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var CzmlDataItemViewModel = require('./CzmlDataItemViewModel');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var WebMapServiceDataItemViewModel = require('./WebMapServiceDataItemViewModel');

var registerGeoDataViewModel = function() {
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('czml', CzmlDataItemViewModel);
    createGeoDataItemFromType.register('wms', WebMapServiceDataItemViewModel);
};

module.exports = registerGeoDataViewModel;
