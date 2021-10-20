import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ApiRequestTraits from "./ApiRequestTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class GeoJsonCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  ApiRequestTraits
) {
  @anyTrait({
    name: "geoJsonData",
    description: "A geojson data object"
  })
  geoJsonData?: JsonObject;

  @primitiveTrait({
    type: "string",
    name: "geoJsonString",
    description: "A geojson string"
  })
  geoJsonString?: string;
}
