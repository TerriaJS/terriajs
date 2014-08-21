'use strict';

/*global require*/

var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var CzmlDataItemViewModel = require('./CzmlDataItemViewModel');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');

var registerGeoDataViewModel = function() {
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('czml', CzmlDataItemViewModel);
};

module.exports = registerGeoDataViewModel;
