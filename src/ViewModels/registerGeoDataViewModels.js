'use strict';

/*global require*/

var ArcGisMapServerDataItemViewModel = require('./ArcGisMapServerDataItemViewModel');
var CkanGroupViewModel = require('./CkanGroupViewModel');
var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var createGeoDataItemFromUrl = require('./createGeoDataItemFromUrl');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var GeoJsonDataItemViewModel = require('./GeoJsonDataItemViewModel');
var KmlDataItemViewModel = require('./KmlDataItemViewModel');
var WebMapServiceDataItemViewModel = require('./WebMapServiceDataItemViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');
var CsvDataItemViewModel = require('./CsvDataItemViewModel');

var registerGeoDataViewModels = function() {
    createGeoDataItemFromType.register('ckan', CkanGroupViewModel);
    createGeoDataItemFromType.register('esri-mapServer', ArcGisMapServerDataItemViewModel);
    createGeoDataItemFromType.register('geojson', GeoJsonDataItemViewModel);
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('kml', KmlDataItemViewModel);
    createGeoDataItemFromType.register('wms', WebMapServiceDataItemViewModel);
    createGeoDataItemFromType.register('wms-getCapabilities', WebMapServiceGroupViewModel);

    createGeoDataItemFromUrl.register(matchesExtension('geojson'), GeoJsonDataItemViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('json'), GeoJsonDataItemViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('kml'), KmlDataItemViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('kmz'), KmlDataItemViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('csv'), CsvDataItemViewModel);
};

function matchesExtension(extension) {
    var regex = new RegExp('\\.' + extension + '$', 'i');
    return function(url) {
        return url.match(regex);
    };
}

module.exports = registerGeoDataViewModels;
