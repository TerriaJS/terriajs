'use strict';

/*global require*/

var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var CkanGroupViewModel = require('./CkanGroupViewModel');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var CzmlItemViewModel = require('./CzmlItemViewModel');
var CatalogGroup = require('./CatalogGroup');
var GeoJsonItemViewModel = require('./GeoJsonItemViewModel');
var KmlItemViewModel = require('./KmlItemViewModel');
var WebFeatureServiceGroupViewModel = require('./WebFeatureServiceGroupViewModel');
var WebFeatureServiceItemViewModel = require('./WebFeatureServiceItemViewModel');
var WebMapServiceGroupViewModel = require('./WebMapServiceGroupViewModel');
var WebMapServiceItemViewModel = require('./WebMapServiceItemViewModel');
var CsvCatalogItem = require('./CsvCatalogItem');
var GpxItemViewModel = require('./GpxItemViewModel');
var OgrItemViewModel = require('./OgrItemViewModel');

var registerCatalogMembers = function() {
    createCatalogMemberFromType.register('ckan', CkanGroupViewModel);
    createCatalogMemberFromType.register('csv', CsvCatalogItem);
    createCatalogMemberFromType.register('czml', CzmlItemViewModel);
    createCatalogMemberFromType.register('esri-mapServer', ArcGisMapServerCatalogItem);
    createCatalogMemberFromType.register('geojson', GeoJsonItemViewModel);
    createCatalogMemberFromType.register('gpx', GpxItemViewModel);
    createCatalogMemberFromType.register('group', CatalogGroup);
    createCatalogMemberFromType.register('kml', KmlItemViewModel);
    createCatalogMemberFromType.register('ogr', OgrItemViewModel);
    createCatalogMemberFromType.register('wfs', WebFeatureServiceItemViewModel);
    createCatalogMemberFromType.register('wfs-getCapabilities', WebFeatureServiceGroupViewModel);
    createCatalogMemberFromType.register('wms', WebMapServiceItemViewModel);
    createCatalogMemberFromType.register('wms-getCapabilities', WebMapServiceGroupViewModel);

    createCatalogItemFromUrl.register(matchesExtension('csv'), CsvCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('czm'), CzmlItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('czml'), CzmlItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('geojson'), GeoJsonItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('gpx'), GpxItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('json'), GeoJsonItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('kml'), KmlItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('kmz'), KmlItemViewModel);
    createCatalogItemFromUrl.register(matchesExtension('topojson'), GeoJsonItemViewModel);
    createCatalogItemFromUrl.register(matchAll, OgrItemViewModel);
};

function matchesExtension(extension) {
    var regex = new RegExp('\\.' + extension + '$', 'i');
    return function(url) {
        return url.match(regex);
    };
}

function matchAll() {
    return true;
}

module.exports = registerCatalogMembers;
