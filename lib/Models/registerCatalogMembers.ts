import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import BingMapsCatalogItem from "./BingMapsCatalogItem";
import CatalogGroup from "./CatalogGroupNew";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Cesium3DTilesCatalogItem from "./Cesium3DTilesCatalogItem";
import CesiumTerrainCatalogItem from "./CesiumTerrainCatalogItem";
import createCatalogItemFromUrl from "./createCatalogItemFromUrl";
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

  createCatalogItemFromUrl.register(
    matchesExtension("csv"),
    CsvCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("czm"),
    CzmlCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("czml"),
    CzmlCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("geojson"),
    GeoJsonCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("json"),
    GeoJsonCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("kml"),
    KmlCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("kmz"),
    KmlCatalogItem.type
  );
  createCatalogItemFromUrl.register(
    matchesExtension("topojson"),
    GeoJsonCatalogItem.type
  );

  // These items work by trying to match a URL, then loading the data. If it fails, they move on.
  createCatalogItemFromUrl.register(
    matchesUrl(/\/wms/i),
    WebMapServiceCatalogGroup.type,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/MapServer\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );
  createCatalogItemFromUrl.register(
    matchesUrl(/\/arcgis\/rest\/.*\/\d+\b/i),
    ArcGisMapServerCatalogItem.type,
    true
  );

  // These don't even try to match a URL, they're just total fallbacks. We really, really want something to work.
  createCatalogItemFromUrl.register(
    s => true,
    WebMapServiceCatalogGroup.type,
    true
  );
  createCatalogItemFromUrl.register(
    s => true,
    ArcGisMapServerCatalogItem.type,
    true
  );
}

function matchesUrl(regex: RegExp) {
  return /./.test.bind(regex);
}

function matchesExtension(extension: string) {
  var regex = new RegExp("\\." + extension + "$", "i");
  return function(url: string) {
    return Boolean(url.match(regex));
  };
}
