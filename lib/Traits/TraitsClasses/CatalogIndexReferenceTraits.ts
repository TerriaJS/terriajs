import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";

export default class CatalogIndexReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Member known container unique IDs",
    description:
      "These are used to load models which this model depends on (eg parent groups)."
  })
  memberKnownContainerUniqueIds: string[] = [];
}
