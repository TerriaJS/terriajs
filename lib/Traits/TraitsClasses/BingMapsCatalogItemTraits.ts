import BingMapsStyle from "terriajs-cesium/Source/Scene/BingMapsStyle";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";

export default class BingMapsCatalogItemTraits extends mixTraits(
  LayerOrderingTraits,
  ImageryProviderTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Map style",
    description: "Type of Bing Maps imagery"
  })
  mapStyle?: BingMapsStyle;

  @primitiveTrait({
    type: "string",
    name: "Key",
    description: "The Bing Maps key"
  })
  key?: string;
}
