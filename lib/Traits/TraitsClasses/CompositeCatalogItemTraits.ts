import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceArrayTrait from "../Decorators/modelReferenceArrayTrait";
import mixTraits from "../mixTraits";
import ModelReference from "../ModelReference";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";

export default class CompositeCatalogItemTraits extends mixTraits(
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @modelReferenceArrayTrait({
    name: "Members",
    description: "The members of this composite.",
    factory: CatalogMemberFactory
  })
  members: ModelReference[] = [];
}
