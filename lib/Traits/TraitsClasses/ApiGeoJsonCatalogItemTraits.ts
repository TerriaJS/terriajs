import ApiRequestTraits from "./ApiRequestTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ApiGeoJsonCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  ApiRequestTraits
) {
  @primitiveTrait({
    name: "Response geosjon path",
    type: "string",
    description:
      "Path to geojson in response. If API response is a list of json objects, this should be the path to the geojson within each object in the list."
  })
  responseGeoJsonPath?: string;
}
