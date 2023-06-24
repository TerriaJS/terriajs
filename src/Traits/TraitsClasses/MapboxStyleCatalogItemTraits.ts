import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";

export default class MapboxStyleCatalogItemTraits extends mixTraits(
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
  url = "https://api.mapbox.com/styles/v1/";

  @primitiveTrait({
    name: "accessToken",
    description: "The username of the map account.",
    type: "string"
  })
  username = "mapbox";

  @primitiveTrait({
    name: "styleId",
    description:
      "The Mapbox Style ID. eg 'streets-v11', 'outdoors-v11'. You can find more styleIds for the 'mapbox' user here: https://docs.mapbox.com/api/maps/styles/#mapbox-styles",
    type: "string"
  })
  styleId?: string;

  @primitiveTrait({
    name: "accessToken",
    description: "The public access token for the imagery.",
    type: "string"
  })
  accessToken?: string;

  @primitiveTrait({
    name: "tilesize",
    description: "The size of the image tiles.",
    type: "number"
  })
  tilesize = 512;

  @primitiveTrait({
    name: "scaleFactor",
    description: "When true, the tiles are rendered at a @2x scale factor.",
    type: "boolean"
  })
  scaleFactor = false;
}
