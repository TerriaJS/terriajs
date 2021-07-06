import BingMapsStyle from "terriajs-cesium/Source/Scene/BingMapsStyle";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";

export default class BingMapsCatalogItemTraits extends mixTraits(
  LayerOrderingTraits,
  RasterLayerTraits,
  MappableTraits,
  CatalogMemberTraits
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
