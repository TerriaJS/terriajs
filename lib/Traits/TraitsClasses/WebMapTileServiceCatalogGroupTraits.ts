import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a single item in the catalog from a url that points to wmts service.`,
  example: {
    type: "wmts",
    id: "a unique id for wmts example",
    name: "wmts example",
    url: "https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
    layer: "Reference_World_Boundaries_and_Places",
    opacity: 1
  }
})
export default class WebMapTileServiceCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Flatten",
    description:
      "True to flatten the layers into a single list; false to use the layer hierarchy."
  })
  flatten?: boolean;
}
