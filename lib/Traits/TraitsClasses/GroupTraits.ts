import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import ModelReference from "../ModelReference";
import modelReferenceArrayTrait from "../Decorators/modelReferenceArrayTrait";
import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class GroupTraits extends ModelTraits {
  @primitiveTrait({
    name: "Is Open",
    description:
      "True if this group is open and its contents are visible; otherwise, false.",
    type: "boolean"
  })
  isOpen: boolean = false;

  @modelReferenceArrayTrait({
    name: "Members",
    description: "The members of this group.",
    factory: CatalogMemberFactory
  })
  members?: ModelReference[];
}
