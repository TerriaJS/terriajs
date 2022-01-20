import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceArrayTrait from "../Decorators/modelReferenceArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelReference from "../ModelReference";
import ModelTraits from "../ModelTraits";

export default class GroupTraits extends ModelTraits {
  @primitiveArrayTrait({
    name: "Exclude members",
    type: "string",
    description: `An array of strings of excluded group and item names. A group or item name that appears in this list will not be shown to the user. This is case-insensitive and will also apply to all child/nested groups`
  })
  excludeMembers?: string[];

  @primitiveTrait({
    name: "Is Open",
    description:
      "True if this group is open and its contents are visible; otherwise, false.",
    type: "boolean"
  })
  isOpen: boolean = false;

  @primitiveTrait({
    name: "Sort members by",
    description:
      "Sort members by the given property/trait. For example `name`, will sort all members by alphabetically",
    type: "string"
  })
  sortMembersBy: string | undefined;

  @modelReferenceArrayTrait({
    name: "Members",
    description: "The members of this group.",
    factory: CatalogMemberFactory
  })
  members?: ModelReference[];
}
