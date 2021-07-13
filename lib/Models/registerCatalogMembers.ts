import ArcGisCatalogGroup from "./Catalog/esri/ArcGisCatalogGroup";
import ArcGisFeatureServerCatalogGroup from "./Catalog/esri/ArcGisFeatureServerCatalogGroup";
import ArcGisFeatureServerCatalogItem from "./Catalog/esri/ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogGroup from "./Catalog/esri/ArcGisMapServerCatalogGroup";
import ArcGisMapServerCatalogItem from "./Catalog/esri/ArcGisMapServerCatalogItem";
import ArcGisPortalCatalogGroup from "./Catalog/esri/ArcGisPortalCatalogGroup";
import ArcGisPortalItemReference from "./Catalog/esri/ArcGisPortalItemReference";
import ArcGisTerrainCatalogItem from "./Catalog/esri/ArcGisTerrainCatalogItem";
import BingMapsCatalogItem from "./Catalog/CatalogItems/BingMapsCatalogItem";
import CartoMapCatalogItem from "./Catalog/CatalogItems/CartoMapCatalogItem";
import CatalogGroup from "./Catalog/CatalogGroupNew";
import CatalogMemberFactory from "./Catalog/CatalogMemberFactory";
import Cesium3DTilesCatalogItem from "./Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import CesiumTerrainCatalogItem from "./Catalog/CatalogItems/CesiumTerrainCatalogItem";
import CkanCatalogGroup from "./Catalog/Ckan/CkanCatalogGroup";
import CkanItemReference from "./Catalog/Ckan/CkanItemReference";
import CompositeCatalogItem from "./Catalog/CatalogItems/CompositeCatalogItem";
import CsvCatalogItem from "./Catalog/CatalogItems/CsvCatalogItem";
import CzmlCatalogItem from "./Catalog/CatalogItems/CzmlCatalogItem";
import GeoJsonCatalogItem from "./Catalog/CatalogItems/GeoJsonCatalogItem";
import GeoRssCatalogItem from "./Catalog/CatalogItems/GeoRssCatalogItem";
import GltfCatalogItem from "./Catalog/CatalogItems/GltfCatalogItem";
import GpxCatalogItem from "./Catalog/CatalogItems/GpxCatalogItem";
import GtfsCatalogItem from "./Catalog/Gtfs/GtfsCatalogItem";
import IonImageryCatalogItem from "./Catalog/CatalogItems/IonImageryCatalogItem";
import KmlCatalogItem from "./Catalog/CatalogItems/KmlCatalogItem";
import MagdaReference from "./Catalog/MagdaReference";
import MapboxVectorTileCatalogItem from "./Catalog/CatalogItems/MapboxVectorTileCatalogItem";
import OpenStreetMapCatalogItem from "./Catalog/CatalogItems/OpenStreetMapCatalogItem";
import SdmxJsonCatalogGroup from "./Catalog/SdmxJson/SdmxJsonCatalogGroup";
import SdmxJsonCatalogItem from "./Catalog/SdmxJson/SdmxJsonCatalogItem";
import SenapsLocationsCatalogItem from "./Catalog/CatalogItems/SenapsLocationsCatalogItem";
import SensorObservationServiceCatalogItem from "./Catalog/CatalogItems/SensorObservationServiceCatalogItem";
import ShapefileCatalogItem from "./Catalog/CatalogItems/ShapefileCatalogItem";
import SplitItemReference from "./SplitItemReference";
import StubCatalogItem from "./Catalog/CatalogItems/StubCatalogItem";
import ThreddsCatalogGroup from "./Catalog/CatalogGroups/ThreddsCatalogGroup";
import UrlReference, { UrlToCatalogMemberMapping } from "./UrlReference";
import WebFeatureServiceCatalogGroup from "./Catalog/Ows/WebFeatureServiceCatalogGroup";
import WebFeatureServiceCatalogItem from "./Catalog/Ows/WebFeatureServiceCatalogItem";
import WebMapServiceCatalogGroup from "./Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "./Catalog/Ows/WebMapServiceCatalogItem";
import WebMapTileServiceCatalogGroup from "./Catalog/Ows/WebMapTileServiceCatalogGroup";
import WebMapTileServiceCatalogItem from "./Catalog/Ows/WebMapTileServiceCatalogItem";
import WebProcessingServiceCatalogFunction from "./Catalog/Ows/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogFunctionJob from "./Catalog/Ows/WebProcessingServiceCatalogFunctionJob";
import WebProcessingServiceCatalogGroup from "./Catalog/Ows/WebProcessingServiceCatalogGroup";
import YDYRCatalogFunction from "./Catalog/CatalogFunctions/YDYRCatalogFunction";
import YDYRCatalogFunctionJob from "./Catalog/CatalogFunctions/YDYRCatalogFunctionJob";
import CswCatalogGroup from "./Catalog/CatalogGroups/CswCatalogGroup";
import { ApiTableCatalogItem } from "./Catalog/CatalogItems/ApiTableCatalogItem";
import OpenDataSoftCatalogGroup from "./Catalog/CatalogGroups/OpenDataSoftCatalogGroup";
import OpenDataSoftCatalogItem from "./Catalog/CatalogItems/OpenDataSoftCatalogItem";

export default function registerCatalogMembers() {
  CatalogMemberFactory.register(CatalogGroup.type, CatalogGroup);
  CatalogMemberFactory.register(StubCatalogItem.type, StubCatalogItem);
  CatalogMemberFactory.register(
    WebMapServiceCatalogItem.type,
    WebMapServiceCatalogItem
  );
  CatalogMemberFactory.register(
    WebMapServiceCatalogGroup.type,
    WebMapServiceCatalogGroup
  );
  CatalogMemberFactory.register(
    WebFeatureServiceCatalogItem.type,
    WebFeatureServiceCatalogItem
  );
  CatalogMemberFactory.register(
    WebFeatureServiceCatalogGroup.type,
    WebFeatureServiceCatalogGroup
  );
  CatalogMemberFactory.register(
    WebMapTileServiceCatalogGroup.type,
    WebMapTileServiceCatalogGroup
  );
  CatalogMemberFactory.register(
    WebMapTileServiceCatalogItem.type,
    WebMapTileServiceCatalogItem
  );
  CatalogMemberFactory.register(GltfCatalogItem.type, GltfCatalogItem);
  CatalogMemberFactory.register(GeoJsonCatalogItem.type, GeoJsonCatalogItem);
  CatalogMemberFactory.register(GpxCatalogItem.type, GpxCatalogItem);
  CatalogMemberFactory.register(GeoRssCatalogItem.type, GeoRssCatalogItem);
  CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);
  CatalogMemberFactory.register(CzmlCatalogItem.type, CzmlCatalogItem);
  CatalogMemberFactory.register(
    ShapefileCatalogItem.type,
    ShapefileCatalogItem
  );
  CatalogMemberFactory.register(ArcGisCatalogGroup.type, ArcGisCatalogGroup);
  CatalogMemberFactory.register(
    ArcGisMapServerCatalogItem.type,
    ArcGisMapServerCatalogItem
  );
  CatalogMemberFactory.register(
    ArcGisMapServerCatalogGroup.type,
    ArcGisMapServerCatalogGroup
  );
  CatalogMemberFactory.register(
    ArcGisFeatureServerCatalogItem.type,
    ArcGisFeatureServerCatalogItem
  );
  CatalogMemberFactory.register(
    ArcGisFeatureServerCatalogGroup.type,
    ArcGisFeatureServerCatalogGroup
  );
  CatalogMemberFactory.register(
    ArcGisPortalCatalogGroup.type,
    ArcGisPortalCatalogGroup
  );
  CatalogMemberFactory.register(
    ArcGisPortalItemReference.type,
    ArcGisPortalItemReference
  );
  CatalogMemberFactory.register(
    ArcGisTerrainCatalogItem.type,
    ArcGisTerrainCatalogItem
  );
  CatalogMemberFactory.register(
    Cesium3DTilesCatalogItem.type,
    Cesium3DTilesCatalogItem
  );
  CatalogMemberFactory.register(GtfsCatalogItem.type, GtfsCatalogItem);

  CatalogMemberFactory.register(BingMapsCatalogItem.type, BingMapsCatalogItem);
  CatalogMemberFactory.register(
    CesiumTerrainCatalogItem.type,
    CesiumTerrainCatalogItem
  );
  CatalogMemberFactory.register(
    IonImageryCatalogItem.type,
    IonImageryCatalogItem
  );
  CatalogMemberFactory.register(
    OpenStreetMapCatalogItem.type,
    OpenStreetMapCatalogItem
  );
  CatalogMemberFactory.register(MagdaReference.type, MagdaReference);
  CatalogMemberFactory.register(KmlCatalogItem.type, KmlCatalogItem);
  CatalogMemberFactory.register(
    MapboxVectorTileCatalogItem.type,
    MapboxVectorTileCatalogItem
  );
  CatalogMemberFactory.register(CartoMapCatalogItem.type, CartoMapCatalogItem);
  CatalogMemberFactory.register(UrlReference.type, UrlReference);
  CatalogMemberFactory.register(SplitItemReference.type, SplitItemReference);
  CatalogMemberFactory.register(YDYRCatalogFunction.type, YDYRCatalogFunction);
  CatalogMemberFactory.register(
    YDYRCatalogFunctionJob.type,
    YDYRCatalogFunctionJob
  );
  CatalogMemberFactory.register(
    SdmxJsonCatalogGroup.type,
    SdmxJsonCatalogGroup
  );
  CatalogMemberFactory.register(SdmxJsonCatalogItem.type, SdmxJsonCatalogItem);
  CatalogMemberFactory.register(
    SenapsLocationsCatalogItem.type,
    SenapsLocationsCatalogItem
  );
  CatalogMemberFactory.register(
    WebProcessingServiceCatalogFunction.type,
    WebProcessingServiceCatalogFunction
  );
  CatalogMemberFactory.register(
    WebProcessingServiceCatalogGroup.type,
    WebProcessingServiceCatalogGroup
  );
  CatalogMemberFactory.register(
    SensorObservationServiceCatalogItem.type,
    SensorObservationServiceCatalogItem
  );
  CatalogMemberFactory.register(
    WebProcessingServiceCatalogFunctionJob.type,
    WebProcessingServiceCatalogFunctionJob
  );
  CatalogMemberFactory.register(
    CompositeCatalogItem.type,
    CompositeCatalogItem
  );
  CatalogMemberFactory.register(CkanCatalogGroup.type, CkanCatalogGroup);
  CatalogMemberFactory.register(CkanItemReference.type, CkanItemReference);
  CatalogMemberFactory.register(ThreddsCatalogGroup.type, ThreddsCatalogGroup);
  CatalogMemberFactory.register(CswCatalogGroup.type, CswCatalogGroup);
  CatalogMemberFactory.register(ApiTableCatalogItem.type, ApiTableCatalogItem);
  CatalogMemberFactory.register(
    OpenDataSoftCatalogGroup.type,
    OpenDataSoftCatalogGroup
  );
  CatalogMemberFactory.register(
    OpenDataSoftCatalogItem.type,
    OpenDataSoftCatalogItem
  );

  UrlToCatalogMemberMapping.register(
    matchesExtension("csv"),
    CsvCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("czm"),
    CzmlCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("czml"),
    CzmlCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("geojson"),
    GeoJsonCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("json"),
    GeoJsonCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("kml"),
    KmlCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("gpx"),
    GpxCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("kmz"),
    KmlCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("topojson"),
    GeoJsonCatalogItem.type
  );
  UrlToCatalogMemberMapping.register(
    matchesExtension("georss"),
    GeoRssCatalogItem.type
  );
  // We try to convert zipped shapefiles to geojson
  UrlToCatalogMemberMapping.register(
    matchesExtension("zip"),
    ShapefileCatalogItem.type
  );

  // These items work by trying to match a URL, then loading the data. If it fails, they move on.
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/wms|\=wms/i),
    WebMapServiceCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/wfs|\=wfs/i),
    WebFeatureServiceCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/wmts|\=wmts/i),
    WebMapTileServiceCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer(\/.*)?$/i),
    ArcGisMapServerCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer\/\d+\b/i),
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer(\/.*)?$/i),
    ArcGisFeatureServerCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/arcgis\/rest\//i),
    ArcGisCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/rest\/.*\/MapServer(\/.*)?$/i),
    ArcGisMapServerCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/rest\/.*\/FeatureServer\/\d+\b/i),
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/rest\/.*\/FeatureServer(\/.*)?$/i),
    ArcGisFeatureServerCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    matchesUrl(/\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );

  // These don't even try to match a URL, they're just total fallbacks. We really, really want something to work.
  UrlToCatalogMemberMapping.register(
    s => true,
    WebMapServiceCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    s => true,
    WebFeatureServiceCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    s => true,
    ArcGisMapServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    s => true,
    ArcGisMapServerCatalogGroup.type,
    true
  );
  UrlToCatalogMemberMapping.register(
    s => true,
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  UrlToCatalogMemberMapping.register(s => true, ArcGisCatalogGroup.type, true);
  UrlToCatalogMemberMapping.register(
    s => true,
    ArcGisFeatureServerCatalogGroup.type,
    true
  );
}

function matchesUrl(regex: RegExp) {
  return /./.test.bind(regex);
}

export function matchesExtension(extension: string) {
  var regex = new RegExp("\\." + extension + "$", "i");
  return function(url: string) {
    return Boolean(url.match(regex));
  };
}
