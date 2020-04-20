import ArcGisFeatureServerCatalogGroup from "./ArcGisFeatureServerCatalogGroup";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import BingMapsCatalogItem from "./BingMapsCatalogItem";
import CartoMapCatalogItem from "./CartoMapCatalogItem";
import CatalogGroup from "./CatalogGroupNew";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Cesium3DTilesCatalogItem from "./Cesium3DTilesCatalogItem";
import CesiumTerrainCatalogItem from "./CesiumTerrainCatalogItem";
import createUrlReferenceFromUrl from "./createUrlReferenceFromUrl";
import CsvCatalogItem from "./CsvCatalogItem";
import CzmlCatalogItem from "./CzmlCatalogItem";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import GltfCatalogItem from "./GltfCatalogItem";
import GtfsCatalogItem from "./GtfsCatalogItem";
import IonImageryCatalogItem from "./IonImageryCatalogItem";
import KmlCatalogItem from "./KmlCatalogItem";
import MagdaReference from "./MagdaReference";
import OpenStreetMapCatalogItem from "./OpenStreetMapCatalogItem";
import WebMapServiceCatalogGroup from "./WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import UrlReference from "./UrlReference";
import WebProcessingServiceCatalogFunction from "./WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogItem from "./WebProcessingServiceCatalogItem";
import CompositeCatalogItem from "./CompositeCatalogItem";
import SplitItemReference from "./SplitItemReference";

export default function registerCatalogMembers() {
  CatalogMemberFactory.register(CatalogGroup.type, CatalogGroup);
  CatalogMemberFactory.register(
    WebMapServiceCatalogItem.type,
    WebMapServiceCatalogItem
  );
  CatalogMemberFactory.register(
    WebMapServiceCatalogGroup.type,
    WebMapServiceCatalogGroup
  );
  CatalogMemberFactory.register(GltfCatalogItem.type, GltfCatalogItem);
  CatalogMemberFactory.register(GeoJsonCatalogItem.type, GeoJsonCatalogItem);
  CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);
  CatalogMemberFactory.register(CzmlCatalogItem.type, CzmlCatalogItem);
  CatalogMemberFactory.register(
    ArcGisMapServerCatalogItem.type,
    ArcGisMapServerCatalogItem
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
  CatalogMemberFactory.register(CartoMapCatalogItem.type, CartoMapCatalogItem);
  CatalogMemberFactory.register(UrlReference.type, UrlReference);
  CatalogMemberFactory.register(SplitItemReference.type, SplitItemReference);
  CatalogMemberFactory.register(
    WebProcessingServiceCatalogFunction.type,
    WebProcessingServiceCatalogFunction
  );
  CatalogMemberFactory.register(
    WebProcessingServiceCatalogItem.type,
    WebProcessingServiceCatalogItem
  );
  CatalogMemberFactory.register(
    CompositeCatalogItem.type,
    CompositeCatalogItem
  );

  createUrlReferenceFromUrl.register(
    matchesExtension("csv"),
    CsvCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("czm"),
    CzmlCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("czml"),
    CzmlCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("geojson"),
    GeoJsonCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("json"),
    GeoJsonCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("kml"),
    KmlCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("kmz"),
    KmlCatalogItem.type
  );
  createUrlReferenceFromUrl.register(
    matchesExtension("topojson"),
    GeoJsonCatalogItem.type
  );

  // These items work by trying to match a URL, then loading the data. If it fails, they move on.
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/wms/i),
    WebMapServiceCatalogGroup.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer\/\d+\b/i),
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/FeatureServer(\/.*)?$/i),
    ArcGisFeatureServerCatalogGroup.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/rest\/.*\/FeatureServer\/\d+\b/i),
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/rest\/.*\/FeatureServer(\/.*)?$/i),
    ArcGisFeatureServerCatalogGroup.type,
    true
  );
  createUrlReferenceFromUrl.register(
    matchesUrl(/\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );

  // These don't even try to match a URL, they're just total fallbacks. We really, really want something to work.
  createUrlReferenceFromUrl.register(
    s => true,
    WebMapServiceCatalogGroup.type,
    true
  );
  createUrlReferenceFromUrl.register(
    s => true,
    ArcGisMapServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
    s => true,
    ArcGisFeatureServerCatalogItem.type,
    true
  );
  createUrlReferenceFromUrl.register(
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
