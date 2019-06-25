import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import primitiveTrait from "./primitiveTrait";

export default class IonImageryCatalogItemTraits extends mixTraits(
  RasterLayerTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Ion Asset ID",
    description: "ID of the Cesium Ion asset to access.",
    type: "number"
  })
  ionAssetId?: number;

  @primitiveTrait({
    name: "Ion Access Token",
    description: "Cesium Ion access token to use to access the imagery.",
    type: "string"
  })
  ionAccessToken?: string;

  @primitiveTrait({
    name: "Ion Server",
    description: "URL of the Cesium Ion API server.",
    type: "string"
  })
  ionServer?: string;
}
