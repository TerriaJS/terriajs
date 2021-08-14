import FeatureInfoTraits from "./FeatureInfoTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class KmlCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "kmlString",
    description: "A kml string"
  })
  kmlString?: string;
}
