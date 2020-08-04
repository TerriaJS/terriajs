import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CkanSharedTraits from "./CkanSharedTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import DataCustodianTraits from "./DataCustodianTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisPortalItemTraits extends mixTraits(
  UrlTraits,
  DataCustodianTraits,
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
