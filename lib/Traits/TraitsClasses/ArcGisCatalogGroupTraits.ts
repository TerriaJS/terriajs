import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a group that has individual ESRI services ("MapServer" or "FeatureServer") in the given URL as members (subgroups) in the catalog.`,
  example: {
    type: "esri-group",
    name: "Sydney",
    url: "https://services1.arcgis.com/cNVyNtjGVZybOQWZ/arcgis/rest/services",
    id: "some id"
  }
})
export default class ArcGisCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
