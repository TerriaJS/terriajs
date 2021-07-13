import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisPortalCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  ArcGisPortalSharedTraits
) {
  @primitiveArrayTrait({
    name: "Blacklist",
    type: "string",
    description: `An array of strings of blacklisted group names and dataset titles.
      A group or dataset that appears in this list will not be shown to the user.`
  })
  blacklist?: string[];

  @anyTrait({
    name: "Search Parameters",
    description: `An object containing parameters matching the ArcGIS Rest API params, see https://developers.arcgis.com/rest/users-groups-and-items/search-reference.htm`
  })
  searchParams?: JsonObject = {
    q: `(type:"Scene Service" OR
         type:"Feature Service" OR
         type:"Map Service" OR
         type:"WMS" OR
         type:"WFS" OR
         type:"KML")`,
    sortField: "title"
  };

  @anyTrait({
    name: "Group Search Parameters",
    description: `An object containing parameters to search by groups using the ArcGIS Rest API params, see https://developers.arcgis.com/rest/users-groups-and-items/group-search.htm
    Note: this setting is only used when "groupBy" option is set to "organisationsGroups".
    `
  })
  groupSearchParams?: JsonObject = {
    q: `orgid:0123456789ABCDEF
       (access:private OR access:org)
       -owner:esri_nav
       -owner:esri_livingatlas
       -owner:esri_boundaries
       -owner:esri_demographics
      `,
    searchUserAccess: "groupMember"
  };

  @primitiveTrait({
    type: "string",
    name: "Group By",
    description: `Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * none - All available datasets are put in a flat list; they are not grouped at all.
     * organisationsGroups - Data is retrieved and sorted by the organisations groups.
     * portalCategories - Data is retrieved and sorted by categories specified by the portal items.
     * usersGroups - Data is retrieved and sorted by the groups particular to the user.
     * Note: This requires a user to be signed into portal, with a "portalUsername" to be set in "terria.userProperties", this is not available by default and requires custom configuration of TerriaMap.
    `
  })
  groupBy?:
    | "usersGroups"
    | "organisationsGroups"
    | "portalCategories"
    | "none" = "none";

  @primitiveTrait({
    type: "string",
    name: "Ungrouped title",
    description: `A title for the group holding all items that don't have a group in an ArcGIS Portal.
      If the value is a blank string or undefined, these items will be left at the top level, not grouped.`
  })
  ungroupedTitle: string = "Ungrouped";

  @primitiveTrait({
    type: "boolean",
    name: "Hide empty groups",
    description: `If a group has no items don't display it in the catalog`
  })
  hideEmptyGroups: boolean = true;
}
