'use strict';

/*global require*/

var AbsIttCatalogGroup = require('./AbsIttCatalogGroup');
var AbsIttCatalogItem = require('./AbsIttCatalogItem');
var ArcGisCatalogGroup = require('./ArcGisCatalogGroup');
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var CatalogGroup = require('./CatalogGroup');
var CesiumTerrainCatalogItem = require('./CesiumTerrainCatalogItem');
var CkanCatalogGroup = require('./CkanCatalogGroup');
var CkanCatalogItem = require('./CkanCatalogItem');
var CompositeCatalogItem = require('./CompositeCatalogItem');
var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CsvCatalogItem = require('./CsvCatalogItem');
var CswCatalogGroup = require('./CswCatalogGroup');
var CzmlCatalogItem = require('./CzmlCatalogItem');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var GpxCatalogItem = require('./GpxCatalogItem');
var KmlCatalogItem = require('./KmlCatalogItem');
var OgrCatalogItem = require('./OgrCatalogItem');
var OpenStreetMapCatalogItem = require('./OpenStreetMapCatalogItem');
var SdmxJsonCatalogItem = require('./SdmxJsonCatalogItem');
var SocrataCatalogGroup = require('./SocrataCatalogGroup');
var UrlTemplateCatalogItem = require('./UrlTemplateCatalogItem');
var WebFeatureServiceCatalogGroup = require('./WebFeatureServiceCatalogGroup');
var WebFeatureServiceCatalogItem = require('./WebFeatureServiceCatalogItem');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMapTileServiceCatalogGroup = require('./WebMapTileServiceCatalogGroup');
var WebMapTileServiceCatalogItem = require('./WebMapTileServiceCatalogItem');
var WebProcessingServiceCatalogGroup = require('./WebProcessingServiceCatalogGroup');
var WebProcessingServiceCatalogItem = require('./WebProcessingServiceCatalogItem');
var WebProcessingServiceCatalogFunction = require('./WebProcessingServiceCatalogFunction');
var WfsFeaturesCatalogGroup = require('./WfsFeaturesCatalogGroup');

var registerCatalogMembers = function() {
    createCatalogMemberFromType.register('abs-itt', AbsIttCatalogItem);
    createCatalogMemberFromType.register('abs-itt-dataset-list', AbsIttCatalogGroup);
    createCatalogMemberFromType.register('async-result', ResultPendingCatalogItem);
    createCatalogMemberFromType.register('ckan', CkanCatalogGroup);
    createCatalogMemberFromType.register('ckan-resource', CkanCatalogItem);
    createCatalogMemberFromType.register('composite', CompositeCatalogItem);
    createCatalogMemberFromType.register('csv', CsvCatalogItem);
    createCatalogMemberFromType.register('csw', CswCatalogGroup);
    createCatalogMemberFromType.register('cesium-terrain', CesiumTerrainCatalogItem);
    createCatalogMemberFromType.register('czml', CzmlCatalogItem);
    createCatalogMemberFromType.register('esri-group', ArcGisCatalogGroup);
    createCatalogMemberFromType.register('esri-mapServer', ArcGisMapServerCatalogItem);
    createCatalogMemberFromType.register('esri-mapServer-group', ArcGisCatalogGroup);
    createCatalogMemberFromType.register('geojson', GeoJsonCatalogItem);
    createCatalogMemberFromType.register('gpx', GpxCatalogItem);
    createCatalogMemberFromType.register('group', CatalogGroup);
    createCatalogMemberFromType.register('kml', KmlCatalogItem);
    createCatalogMemberFromType.register('kmz', KmlCatalogItem);
    createCatalogMemberFromType.register('ogr', OgrCatalogItem);
    createCatalogMemberFromType.register('open-street-map', OpenStreetMapCatalogItem);
    createCatalogMemberFromType.register('sdmx-json', SdmxJsonCatalogItem);
    createCatalogMemberFromType.register('socrata', SocrataCatalogGroup);
    createCatalogMemberFromType.register('url-template', UrlTemplateCatalogItem);
    createCatalogMemberFromType.register('wfs', WebFeatureServiceCatalogItem);
    createCatalogMemberFromType.register('wfs-features-group', WfsFeaturesCatalogGroup);
    createCatalogMemberFromType.register('wfs-getCapabilities', WebFeatureServiceCatalogGroup);
    createCatalogMemberFromType.register('wms', WebMapServiceCatalogItem);
    createCatalogMemberFromType.register('wms-getCapabilities', WebMapServiceCatalogGroup);
    createCatalogMemberFromType.register('wmts', WebMapTileServiceCatalogItem);
    createCatalogMemberFromType.register('wmts-getCapabilities', WebMapTileServiceCatalogGroup);
    createCatalogMemberFromType.register('wps-getCapabilities', WebProcessingServiceCatalogGroup);
    createCatalogMemberFromType.register('wps-result', WebProcessingServiceCatalogItem);
    createCatalogMemberFromType.register('wps', WebProcessingServiceCatalogFunction);

    createCatalogItemFromUrl.register(matchesExtension('csv'), CsvCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('czm'), CzmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('czml'), CzmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('geojson'), GeoJsonCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('gpx'), GpxCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('json'), GeoJsonCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('kml'), KmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('kmz'), KmlCatalogItem);
    createCatalogItemFromUrl.register(matchesExtension('topojson'), GeoJsonCatalogItem);

    // These items work by trying to match a URL, then loading the data. If it fails, they move on.
    createCatalogItemFromUrl.register(matchesUrl(/\/WMTS\b/i), WebMapTileServiceCatalogGroup, true);
    createCatalogItemFromUrl.register(matchesUrl(/\/wfs/i), WebFeatureServiceCatalogGroup, true);
    createCatalogItemFromUrl.register(matchesUrl(/\/wms/i), WebMapServiceCatalogGroup, true);
    createCatalogItemFromUrl.register(matchesUrl(/\/arcgis\/rest\/.*\/\d+\b/i), ArcGisMapServerCatalogItem, true);
    createCatalogItemFromUrl.register(matchesUrl(/\/ArcGis\/rest\//i), ArcGisCatalogGroup, true);
    createCatalogItemFromUrl.register(matchesUrl(/\/sdmx-json\//i), SdmxJsonCatalogItem, true);

    // These don't even try to match a URL, they're just total fallbacks. We really, really want something to work.
    createCatalogItemFromUrl.register(undefined, WebMapServiceCatalogGroup, true);
    createCatalogItemFromUrl.register(undefined, WebFeatureServiceCatalogGroup, true);
    createCatalogItemFromUrl.register(undefined, ArcGisMapServerCatalogItem, true);
    createCatalogItemFromUrl.register(undefined, ArcGisCatalogGroup, true);
};

function matchesExtension(extension) {
    var regex = new RegExp('\\.' + extension + '$', 'i');
    return function(url) {
        return url.match(regex);
    };
}

function matchesUrl(regex) {
    return /./.test.bind(regex);
}

module.exports = registerCatalogMembers;
