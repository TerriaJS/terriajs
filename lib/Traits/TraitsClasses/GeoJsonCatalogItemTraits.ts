import ApiRequestTraits from "./ApiRequestTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
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

  @primitiveTrait({
    name: "Response geosjon path",
    type: "string",
    description:
      "Path to geojson in response. If API response is a list of json objects, this should be the path to the geojson within each object in the list."
  })
  responseGeoJsonPath?: string;
}
