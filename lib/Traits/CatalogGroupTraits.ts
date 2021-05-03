import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";

export default class CatalogGroupTraits extends mixTraits(
  GroupTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Preserve Order",
    description:
      "Preserves the ordering of members. If set to `false` CatalogGroup `members` are sorted by their name.",
    type: "boolean"
  })
  preserveOrder: boolean = true;
}
