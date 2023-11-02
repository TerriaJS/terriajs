import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";

export default class MapboxMapCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  CatalogMemberTraits,
  MappableTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    name: "url",
    description: "The Mapbox server url.",
    type: "string"
  })
  url = "https://api.mapbox.com/v4/";

  @primitiveTrait({
    name: "mapId",
    description: "The Mapbox Map ID.",
    type: "string"
  })
  mapId?: string;

  @primitiveTrait({
    name: "accessToken",
    description: "The public access token for the imagery.",
    type: "string"
  })
  accessToken?: string;

  @primitiveTrait({
    name: "format",
    description: "The format of the image request.",
    type: "string"
  })
  format = "png";
}
