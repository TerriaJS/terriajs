import mixTraits from "../mixTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import { GeoJsonTraits } from "./GeoJsonTraits";

export default class GpxCatalogItemTraits extends mixTraits(GeoJsonTraits) {
  @primitiveTrait({
    type: "string",
    name: "GPX String",
    description: "A GPX string."
  })
  gpxString?: string;

  clampToGround = false;
}
