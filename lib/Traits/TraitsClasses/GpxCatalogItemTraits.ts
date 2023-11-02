import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class GpxCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "string",
    name: "GPX String",
    description: "A GPX string."
  })
  gpxString?: string;
}
