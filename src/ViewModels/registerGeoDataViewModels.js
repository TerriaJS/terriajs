'use strict';

/*global require*/

var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var createGeoDataItemFromUrl = require('./createGeoDataItemFromUrl');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var GeoJsonDataSourceViewModel = require('./GeoJsonDataSourceViewModel');
var WebMapServiceDataSourceViewModel = require('./WebMapServiceDataSourceViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');

var registerGeoDataViewModels = function() {
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('wms', WebMapServiceDataSourceViewModel);
    createGeoDataItemFromType.register('wms-getCapabilities', WebMapServiceGroupViewModel);
    createGeoDataItemFromType.register('geoJson', GeoJsonDataSourceViewModel);

    createGeoDataItemFromUrl.register(matchesExtension('geojson'), GeoJsonDataSourceViewModel);
};

function matchesExtension(extension) {
    var regex = new RegExp('\\.' + extension + '$', 'i');
    return function(url) {
        return url.match(regex);
    };
}

module.exports = registerGeoDataViewModels;
