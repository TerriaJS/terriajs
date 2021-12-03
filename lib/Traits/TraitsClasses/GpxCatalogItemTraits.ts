import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";

export default class GpxCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "GPX String",
    description: "A GPX string."
  })
  gpxString?: string;
}
