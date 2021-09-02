import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";

export default class CatalogIndexReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Member knownContainerUniqueIds",
    description: "Member knownContainerUniqueIds."
  })
  memberKnownContainerUniqueIds: string[] = [];
}
