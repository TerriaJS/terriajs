import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import { GeoJsonTraits } from "./GeoJsonTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";

export default class GeoJsonCatalogItemTraits extends mixTraits(GeoJsonTraits) {
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
