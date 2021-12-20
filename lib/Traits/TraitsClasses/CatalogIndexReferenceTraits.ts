import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
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

  @primitiveArrayTrait({
    type: "string",
    name: "Share keys",
    description:
      "Share keys can be used to resolve older model IDs to this model."
  })
  shareKeys?: string[];

  @primitiveTrait({
    name: "Name in catalog",
    description:
      "The name of the item to be displayed in the catalog. This will only be defined if it differs from `name`.",
    type: "string"
  })
  nameInCatalog?: string;
}
