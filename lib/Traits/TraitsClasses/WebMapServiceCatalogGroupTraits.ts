import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ExportWebCoverageServiceTraits from "./ExportWebCoverageServiceTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a group of all layers (or subgroups) in the catalog from a url that points to a wms service.`,
  example: {
    type: "wms-group",
    name: "wms-group example",
    url: "https://ows.services.dea.ga.gov.au",
    id: "a unique id for wms-group example"
  }
})
export default class WebMapServiceCatalogGroupTraits extends mixTraits(
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

  @objectTrait({
    name: "Per layer WebCoverageService",
    description:
      "To enable Export/WebCoverageService for **all** WMS layers in this group, set `perLayerLinkedWcs.linkedWcsUrl`. `linkedWcsCoverage` will be set to the WMS layer `Name` if it is defined, layer `Title` otherwise.",
    type: ExportWebCoverageServiceTraits
  })
  perLayerLinkedWcs?: ExportWebCoverageServiceTraits;
}
