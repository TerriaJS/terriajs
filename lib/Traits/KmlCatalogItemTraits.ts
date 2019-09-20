import FeatureInfoTraits from "./FeatureInfoTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import anyTrait from "./anyTrait";
import primitiveTrait from "./primitiveTrait";

export default class KmlCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "kmlData",
    description: "A DOM document"
  })
  kmlData?: Document;

  @primitiveTrait({
    type: "string",
    name: "kmlString",
    description: "A kml string"
  })
  kmlString?: string;
}