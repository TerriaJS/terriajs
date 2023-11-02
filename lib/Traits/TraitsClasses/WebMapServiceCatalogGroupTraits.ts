import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ExportWebCoverageServiceTraits from "./ExportWebCoverageServiceTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

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
