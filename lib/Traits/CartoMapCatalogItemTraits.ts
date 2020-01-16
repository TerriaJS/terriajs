import primitiveTrait from "./primitiveTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";
import objectArrayTrait from "./objectArrayTrait";
import anyTrait from "./anyTrait";
import mixTraits from "./mixTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import MappableTraits from "./MappableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import UrlTraits from "./UrlTraits";
import LegendTraits from "./LegendTraits";
import { JsonObject } from "../Core/Json";

export default class CartoMapCatalogItemTraits extends mixTraits(
  RasterLayerTraits,
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
    type: "string",
    name: "Tile url",
    description: "The template URL from which to get tiles"
  })
  tileUrl?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Tile subdomains",
    description: "The subdomains from which to get tiles"
  })
  tileSubdomains?: string[];

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

  @primitiveTrait({
    name: "Attribution",
    description: "The attribution to display with the data.",
    type: "string"
  })
  attribution?: string;

  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "index"
  })
  legends?: LegendTraits[];
}
