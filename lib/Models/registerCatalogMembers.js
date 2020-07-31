"use strict";

/*global require*/

var AbsIttCatalogGroup = require("./AbsIttCatalogGroup");
var AbsIttCatalogItem = require("./AbsIttCatalogItem");
var ArcGisCatalogGroup = require("./ArcGisCatalogGroup");
var ArcGisFeatureServerCatalogGroup = require("./ArcGisFeatureServerCatalogGroup");
var ArcGisFeatureServerCatalogItem = require("./ArcGisFeatureServerCatalogItem");
var ArcGisMapServerCatalogGroup = require("./ArcGisMapServerCatalogGroup");
var ArcGisMapServerCatalogItem = require("./ArcGisMapServerCatalogItem");
var ResultPendingCatalogItem = require("./ResultPendingCatalogItem");
var BingMapsCatalogItem = require("./BingMapsCatalogItem");
var CartoMapCatalogItem = require("./CartoMapCatalogItem");
var CatalogGroup = require("./CatalogGroup");
var Cesium3DTilesCatalogItem = require("./Cesium3DTilesCatalogItem");
var CesiumTerrainCatalogItem = require("./CesiumTerrainCatalogItem");
var CkanCatalogGroup = require("./CkanCatalogGroup");
var CkanCatalogItem = require("./CkanCatalogItem");
var CompositeCatalogItem = require("./CompositeCatalogItem");
var createCatalogItemFromUrl = require("./createCatalogItemFromUrl");
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var CsvCatalogItem = require("./CsvCatalogItem");
var CswCatalogGroup = require("./CswCatalogGroup");
var CzmlCatalogItem = require("./CzmlCatalogItem");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var GeoRssCatalogItem = require("./GeoRssCatalogItem");
var GltfCatalogItem = require("./GltfCatalogItem");
var GpxCatalogItem = require("./GpxCatalogItem");
var IonImageryCatalogItem = require("./IonImageryCatalogItem");
var KmlCatalogItem = require("./KmlCatalogItem");
var MapboxVectorTileCatalogItem = require("./MapboxVectorTileCatalogItem");
var OgrCatalogItem = require("./OgrCatalogItem");
var OpenStreetMapCatalogItem = require("./OpenStreetMapCatalogItem");
var SdmxJsonCatalogItem = require("./SdmxJsonCatalogItem");
var SensorObservationServiceCatalogItem = require("./SensorObservationServiceCatalogItem");
var SocrataCatalogGroup = require("./SocrataCatalogGroup");
var TerriaJsonCatalogFunction = require("./TerriaJsonCatalogFunction");
var UrlTemplateCatalogItem = require("./UrlTemplateCatalogItem");
var WebFeatureServiceCatalogGroup = require("./WebFeatureServiceCatalogGroup");
var WebFeatureServiceCatalogItem = require("./WebFeatureServiceCatalogItem");
var WebMapServiceCatalogGroup = require("./WebMapServiceCatalogGroup");
var WebMapServiceCatalogItem = require("./WebMapServiceCatalogItem");
var WebMapTileServiceCatalogGroup = require("./WebMapTileServiceCatalogGroup");
var WebMapTileServiceCatalogItem = require("./WebMapTileServiceCatalogItem");
var WebProcessingServiceCatalogGroup = require("./WebProcessingServiceCatalogGroup");
var WebProcessingServiceCatalogItem = require("./WebProcessingServiceCatalogItem");
var WebProcessingServiceCatalogFunction = require("./WebProcessingServiceCatalogFunction");
var WfsFeaturesCatalogGroup = require("./WfsFeaturesCatalogGroup");
var MagdaCatalogItem = require("./MagdaCatalogItem");
var MapboxMapCatalogItem = require("./MapboxMapCatalogItem");
var MapboxStyleCatalogItem = require("./MapboxStyleCatalogItem");

var registerCatalogMembers = function() {
  createCatalogMemberFromType.register("3d-tiles", Cesium3DTilesCatalogItem);
  createCatalogMemberFromType.register("abs-itt", AbsIttCatalogItem);
  createCatalogMemberFromType.register(
    "abs-itt-dataset-list",
    AbsIttCatalogGroup
  );
  createCatalogMemberFromType.register(
    "result-pending",
    ResultPendingCatalogItem
  );
  createCatalogMemberFromType.register("bing-maps", BingMapsCatalogItem);
  createCatalogMemberFromType.register("carto", CartoMapCatalogItem);
  createCatalogMemberFromType.register("ckan", CkanCatalogGroup);
  createCatalogMemberFromType.register("ckan-resource", CkanCatalogItem);
  createCatalogMemberFromType.register("composite", CompositeCatalogItem);
  createCatalogMemberFromType.register("csv", CsvCatalogItem);
  createCatalogMemberFromType.register("csw", CswCatalogGroup);
  createCatalogMemberFromType.register("georss", GeoRssCatalogItem);
  createCatalogMemberFromType.register(
    "cesium-terrain",
    CesiumTerrainCatalogItem
  );
  createCatalogMemberFromType.register("czml", CzmlCatalogItem);
  createCatalogMemberFromType.register("esri-group", ArcGisCatalogGroup);
  createCatalogMemberFromType.register(
    "esri-featureServer",
    ArcGisFeatureServerCatalogItem
  );
  createCatalogMemberFromType.register(
    "esri-featureServer-group",
    ArcGisFeatureServerCatalogGroup
  );
  createCatalogMemberFromType.register(
    "esri-mapServer",
    ArcGisMapServerCatalogItem
  );
  createCatalogMemberFromType.register(
    "esri-mapServer-group",
    ArcGisMapServerCatalogGroup
  );
  createCatalogMemberFromType.register("geojson", GeoJsonCatalogItem);
  createCatalogMemberFromType.register("gltf", GltfCatalogItem);
  createCatalogMemberFromType.register("gpx", GpxCatalogItem);
  createCatalogMemberFromType.register("group", CatalogGroup);
  createCatalogMemberFromType.register("ion-imagery", IonImageryCatalogItem);
  createCatalogMemberFromType.register("kml", KmlCatalogItem);
  createCatalogMemberFromType.register("kmz", KmlCatalogItem);
  createCatalogMemberFromType.register("mvt", MapboxVectorTileCatalogItem);
  createCatalogMemberFromType.register("ogr", OgrCatalogItem);
  createCatalogMemberFromType.register(
    "open-street-map",
    OpenStreetMapCatalogItem
  );
  createCatalogMemberFromType.register("sdmx-json", SdmxJsonCatalogItem);
  createCatalogMemberFromType.register("socrata", SocrataCatalogGroup);
  createCatalogMemberFromType.register(
    "sos",
    SensorObservationServiceCatalogItem
  );
  createCatalogMemberFromType.register(
    "terria-json",
    TerriaJsonCatalogFunction
  );
  createCatalogMemberFromType.register("url-template", UrlTemplateCatalogItem);
  createCatalogMemberFromType.register("wfs", WebFeatureServiceCatalogItem);
  createCatalogMemberFromType.register(
    "wfs-features-group",
    WfsFeaturesCatalogGroup
  );
  createCatalogMemberFromType.register(
    "wfs-getCapabilities",
    WebFeatureServiceCatalogGroup
  );
  createCatalogMemberFromType.register("wms", WebMapServiceCatalogItem);
  createCatalogMemberFromType.register(
    "wms-getCapabilities",
    WebMapServiceCatalogGroup
  );
  createCatalogMemberFromType.register("wmts", WebMapTileServiceCatalogItem);
  createCatalogMemberFromType.register(
    "wmts-getCapabilities",
    WebMapTileServiceCatalogGroup
  );
  createCatalogMemberFromType.register(
    "wps-getCapabilities",
    WebProcessingServiceCatalogGroup
  );
  createCatalogMemberFromType.register(
    "wps-result",
    WebProcessingServiceCatalogItem
  );
  createCatalogMemberFromType.register(
    "wps",
    WebProcessingServiceCatalogFunction
  );
  createCatalogMemberFromType.register("magda-item", MagdaCatalogItem);
  createCatalogMemberFromType.register("mapbox-map", MapboxMapCatalogItem);
  createCatalogMemberFromType.register("mapbox-style", MapboxStyleCatalogItem);

  createCatalogItemFromUrl.register(matchesExtension("csv"), CsvCatalogItem);
  createCatalogItemFromUrl.register(matchesExtension("czm"), CzmlCatalogItem);
  createCatalogItemFromUrl.register(matchesExtension("czml"), CzmlCatalogItem);
  createCatalogItemFromUrl.register(
    matchesExtension("geojson"),
    GeoJsonCatalogItem
  );
  createCatalogItemFromUrl.register(
    matchesExtension("georss"),
    GeoRssCatalogItem
  );
  createCatalogItemFromUrl.register(matchesExtension("gpx"), GpxCatalogItem);
  createCatalogItemFromUrl.register(
    matchesExtension("json"),
    GeoJsonCatalogItem
  );
  createCatalogItemFromUrl.register(matchesExtension("kml"), KmlCatalogItem);
  createCatalogItemFromUrl.register(matchesExtension("kmz"), KmlCatalogItem);
  createCatalogItemFromUrl.register(
    matchesExtension("topojson"),
    GeoJsonCatalogItem
  );

  // These items work by trying to match a URL, then loading the data. If it fails, they move on.
  createCatalogItemFromUrl.register(
    matchesUrl(/\/WMTS\b/i),
    WebMapTileServiceCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/wfs|\=wfs/i),
    WebFeatureServiceCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/wms|\=wms/i),
    WebMapServiceCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer\/\d+\b/i),
    ArcGisFeatureServerCatalogItem,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer(\/.*)?$/i),
    ArcGisMapServerCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer(\/.*)?$/i),
    ArcGisFeatureServerCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/ArcGis\/rest\//i),
    ArcGisCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/sdmx-json\//i),
    SdmxJsonCatalogItem,
    true
  );

  // These don't even try to match a URL, they're just total fallbacks. We really, really want something to work.
  createCatalogItemFromUrl.register(undefined, WebMapServiceCatalogGroup, true);
  createCatalogItemFromUrl.register(
    undefined,
    WebFeatureServiceCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(
    undefined,
    ArcGisMapServerCatalogItem,
    true
  );
  createCatalogItemFromUrl.register(
    undefined,
    ArcGisMapServerCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(undefined, ArcGisCatalogGroup, true);
  createCatalogItemFromUrl.register(
    undefined,
    ArcGisFeatureServerCatalogItem,
    true
  );
  createCatalogItemFromUrl.register(
    undefined,
    ArcGisFeatureServerCatalogGroup,
    true
  );
  createCatalogItemFromUrl.register(undefined, GeoRssCatalogItem, true);
};

function matchesExtension(extension) {
  var regex = new RegExp("\\." + extension + "$", "i");
  return function(url) {
    return url.match(regex);
  };
}

function matchesUrl(regex) {
  return /./.test.bind(regex);
}

// Uncomment this if you need to deprecated a catalog item type.
// function createDeprecatedConstructor(deprecatedName, CatalogItemConstructor) {
//     return function(terria) {
//         deprecationWarning(deprecatedName, 'The catalog member type "' + deprecatedName + '" has been deprecated.  Please update your catalog to use "' + CatalogItemConstructor.prototype.type + '" instead.');
//         return new CatalogItemConstructor(terria);
//     g};
// }

module.exports = registerCatalogMembers;
