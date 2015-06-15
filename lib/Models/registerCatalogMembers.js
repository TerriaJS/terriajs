'use strict';

/*global require*/

var ArcGisCatalogGroup = require('./ArcGisCatalogGroup');
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var CkanCatalogGroup = require('./CkanCatalogGroup');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var CzmlCatalogItem = require('./CzmlCatalogItem');
var CatalogGroup = require('./CatalogGroup');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var KmlCatalogItem = require('./KmlCatalogItem');
var WebFeatureServiceCatalogGroup = require('./WebFeatureServiceCatalogGroup');
var WebFeatureServiceCatalogItem = require('./WebFeatureServiceCatalogItem');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMapTileServiceCatalogGroup = require('./WebMapTileServiceCatalogGroup');
var WebMapTileServiceCatalogItem = require('./WebMapTileServiceCatalogItem');

var OpenStreetMapCatalogItem = require('./OpenStreetMapCatalogItem');

var CsvCatalogItem = require('./CsvCatalogItem');
var GpxCatalogItem = require('./GpxCatalogItem');
var OgrCatalogItem = require('./OgrCatalogItem');
var AbsIttCatalogGroup = require('./AbsIttCatalogGroup');
var AbsIttCatalogItem = require('./AbsIttCatalogItem');

var registerCatalogMembers = function() {
    createCatalogMemberFromType.register('ckan', CkanCatalogGroup);
    createCatalogMemberFromType.register('csv', CsvCatalogItem);
    createCatalogMemberFromType.register('czml', CzmlCatalogItem);
    createCatalogMemberFromType.register('esri-mapServer', ArcGisMapServerCatalogItem);
    createCatalogMemberFromType.register('esri-mapServer-group', ArcGisCatalogGroup);
    createCatalogMemberFromType.register('esri-group', ArcGisCatalogGroup);
    createCatalogMemberFromType.register('geojson', GeoJsonCatalogItem);
    createCatalogMemberFromType.register('gpx', GpxCatalogItem);
    createCatalogMemberFromType.register('group', CatalogGroup);
    createCatalogMemberFromType.register('kml', KmlCatalogItem);
    createCatalogMemberFromType.register('kmz', KmlCatalogItem);
    createCatalogMemberFromType.register('ogr', OgrCatalogItem);
    createCatalogMemberFromType.register('wfs', WebFeatureServiceCatalogItem);
    createCatalogMemberFromType.register('wfs-getCapabilities', WebFeatureServiceCatalogGroup);
    createCatalogMemberFromType.register('wms', WebMapServiceCatalogItem);
    createCatalogMemberFromType.register('wms-getCapabilities', WebMapServiceCatalogGroup);
    createCatalogMemberFromType.register('wmts', WebMapTileServiceCatalogItem);
    createCatalogMemberFromType.register('wmts-getCapabilities', WebMapTileServiceCatalogGroup);
    createCatalogMemberFromType.register('open-street-map', OpenStreetMapCatalogItem);
    createCatalogMemberFromType.register('abs-itt', AbsIttCatalogItem);
    createCatalogMemberFromType.register('abs-itt-dataset-list', AbsIttCatalogGroup);

    createCatalogItemFromUrl.register(matchesExtension('csv'), CsvCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('czm'), CzmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('czml'), CzmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('geojson'), GeoJsonCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('gpx'), GpxCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('json'), GeoJsonCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('kml'), KmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('kmz'), KmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('topojson'), GeoJsonCatalogItem);
    createCatalogItemFromUrl.register(matchAll, OgrCatalogItem);
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
