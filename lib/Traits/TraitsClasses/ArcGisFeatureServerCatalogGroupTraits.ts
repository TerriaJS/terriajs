import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a group that has individual ESRI WFS layers in the given URL as members.

  <strong>Note:</strong> <i>To exclude unwanted layers, specify their <b>names</b> in property <code>excludeMembers</code>.</i>`,
  example: {
    url: "https://services7.arcgis.com/fVJQ0uhT9L4zp35f/arcgis/rest/services/ActivityArea_gdb/FeatureServer",
    type: "esri-featureServer-group",
    excludeMembers: ["BCC SHWEP"],
    name: "Activity Area",
    id: "some id"
  }
})
export default class ArcGisFeatureServerCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
