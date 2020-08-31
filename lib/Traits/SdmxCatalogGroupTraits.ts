import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import UrlTraits from "./UrlTraits";
import { ConceptTraits } from "./SdmxCommonTraits";

export default class SdmxCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {
  @objectArrayTrait({
    type: ConceptTraits,
    idProperty: "id",
    name: "Concept overrides",
    description:
      "This provides ability to override Dataflow dimensions by concept id. For example, setting a default value for a given concept."
  })
  conceptOverrides?: ConceptTraits[];
}
