import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import SplitterTraits from "./SplitterTraits";
import UrlTraits from "./UrlTraits";

export default class CartoMapCatalogItemTraits extends mixTraits(
  SplitterTraits,
  RasterLayerTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "Config",
    description: "The configuration information to pass to the Carto Maps API"
  })
  config?: JsonObject | string;

  @primitiveTrait({
    type: "string",
    name: "Authorization token",
    description: "The authorization token to pass to the Carto Maps API"
  })
  auth_token?: string;

  @primitiveTrait({
    name: "Minimum Level",
    description: "The minimum tile level to retrieve from the map data",
    type: "number"
  })
  minimumLevel = 0;

  @primitiveTrait({
    name: "Maximum Level",
    description: "The maximum tile level to retrieve from the map data",
    type: "number"
  })
  maximumLevel = 25;
}
