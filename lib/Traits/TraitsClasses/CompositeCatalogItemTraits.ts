import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import modelReferenceArrayTrait from "../Decorators/modelReferenceArrayTrait";
import mixTraits from "../mixTraits";
import ModelReference from "../ModelReference";
import { traitClass } from "../Trait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";

@traitClass({
  description: `Creates one catalog item that combines multiple datasets.`,
  example: {
    type: "composite",
    name: "Combine Multiple Datasets",
    id: "some unique ID",
    members: [
      {
        url: "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme/MapServer/8",
        id: "one unique ID",
        type: "esri-mapServer"
      },
      {
        url: "https://tiles.terria.io/static/auspost-locations.csv",
        id: "another unique ID",
        type: "csv"
      }
    ]
  }
})
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
