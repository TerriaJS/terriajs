'use strict';

/*global require*/

var ArcGisMapServerDataSourceViewModel = require('./ArcGisMapServerDataSourceViewModel');
var CkanGroupViewModel = require('./CkanGroupViewModel');
var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var createGeoDataItemFromUrl = require('./createGeoDataItemFromUrl');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var GeoJsonDataSourceViewModel = require('./GeoJsonDataSourceViewModel');
var KmlDataSourceViewModel = require('./KmlDataSourceViewModel');
var WebMapServiceDataSourceViewModel = require('./WebMapServiceDataSourceViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');

var registerGeoDataViewModels = function() {
    createGeoDataItemFromType.register('ckan', CkanGroupViewModel);
    createGeoDataItemFromType.register('esri-mapServer', ArcGisMapServerDataSourceViewModel);
    createGeoDataItemFromType.register('geojson', GeoJsonDataSourceViewModel);
    createGeoDataItemFromType.register('group', GeoDataGroupViewModel);
    createGeoDataItemFromType.register('wms', WebMapServiceDataSourceViewModel);
    createGeoDataItemFromType.register('wms-getCapabilities', WebMapServiceGroupViewModel);

    createGeoDataItemFromUrl.register(matchesExtension('geojson'), GeoJsonDataSourceViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('json'), GeoJsonDataSourceViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('kml'), KmlDataSourceViewModel);
    createGeoDataItemFromUrl.register(matchesExtension('kmz'), KmlDataSourceViewModel);
};

function matchesExtension(extension) {
    var regex = new RegExp('\\.' + extension + '$', 'i');
    return function(url) {
        return url.match(regex);
    };
}

module.exports = registerGeoDataViewModels;
