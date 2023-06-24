import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisPortalItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberReferenceTraits,
  ArcGisPortalSharedTraits
) {
  @primitiveTrait({
    name: "Item ID",
    description: "The ID of the portal item.",
    type: "string"
  })
  itemId?: string;
}
