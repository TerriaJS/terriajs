import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a group that has individual ESRI WMS layers in the given URL as members in the catalog.`,
  example: {
    type: "esri-mapServer-group",
    name: "Catchment Scale Land Use",
    id: "354db2f2",
    url: "https://www.asris.csiro.au/arcgis/rest/services/abares/clum_50m_2018/MapServer"
  }
})
export default class ArcGisMapServerCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
