import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import MappableTraits from "./MappableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";

export default class BingMapsCatalogItemTraits extends mixTraits(
  RasterLayerTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Map style",
    description: "Type of Bing Maps imagery"
  })
  mapStyle?: string;

  @primitiveTrait({
    type: "string",
    name: "Key",
    description: "The Bing Maps key"
  })
  key?: string;
}
