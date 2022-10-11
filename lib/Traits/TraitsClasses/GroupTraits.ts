import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceArrayTrait from "../Decorators/modelReferenceArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelReference from "../ModelReference";
import { ItemPropertiesTraits } from "./ItemPropertiesTraits";

export default class GroupTraits extends mixTraits(ItemPropertiesTraits) {
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
    name: "Merge by name",
    description: "Merge member groups by name.",
    type: "boolean"
  })
  mergeGroupsByName: boolean = false;

  @primitiveTrait({
    name: "Sort members by",
    description:
      "Sort members by the given property/trait. For example `name`, will sort all members by alphabetically",
    type: "string"
  })
  sortMembersBy?: string;

  @modelReferenceArrayTrait({
    name: "Members",
    description: "The members of this group.",
    factory: CatalogMemberFactory
  })
  members?: ModelReference[];
}
