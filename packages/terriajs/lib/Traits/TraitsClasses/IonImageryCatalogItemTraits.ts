import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class IonImageryCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
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
