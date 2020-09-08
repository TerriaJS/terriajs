import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisPortalCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveArrayTrait({
    name: "Blacklist",
    type: "string",
    description: `An array of strings of blacklisted group names and dataset titles.
      A group or dataset that appears in this list will not be shown to the user.`
  })
  blacklist?: string[];

  @primitiveTrait({
    type: "boolean",
    name: "Hide empty groups",
    description: `If a group has no items don't display it in the catalog`
  })
  hideEmptyGroups: boolean = true;
}
