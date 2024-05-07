import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import SdmxCommonTraits from "./SdmxCommonTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates one catalog group from url that points to an sdmx service.`,
  example: {
    id: "some unique id",
    type: "sdmx-group",
    name: "sdmx-group example",
    url: "https://api.data.abs.gov.au",
    mergeGroupsByName: true
  }
})
export default class SdmxCatalogGroupTraits extends mixTraits(
  SdmxCommonTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  GroupTraits
) {}
