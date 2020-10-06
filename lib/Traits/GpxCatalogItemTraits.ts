import mixTraits from "./mixTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import anyTrait from "./anyTrait";
import { JsonObject } from "../Core/Json";
import primitiveTrait from "./primitiveTrait";

export default class GpxCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "GPX String",
    description: "A GPX string."
  })
  gpxString?: string;
}
