import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import BingMapsCatalogItem from "./BingMapsCatalogItem";
import CatalogGroup from "./CatalogGroupNew";
import CatalogMemberFactory from "./CatalogMemberFactory";
import Cesium3DTilesCatalogItem from "./Cesium3DTilesCatalogItem";
import CesiumTerrainCatalogItem from "./CesiumTerrainCatalogItem";
import CsvCatalogItem from "./CsvCatalogItem";
import CzmlCatalogItem from "./CzmlCatalogItem";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import GltfCatalogItem from "./GltfCatalogItem";
import GtfsCatalogItem from "./GtfsCatalogItem";
import IonImageryCatalogItem from "./IonImageryCatalogItem";
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
}
