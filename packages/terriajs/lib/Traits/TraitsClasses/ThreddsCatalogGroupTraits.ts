import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates one catalog group from url that points to a thredds service.`,
  example: {
    type: "thredds-group",
    url: "http://dapds00.nci.org.au/thredds/catalog/rr9/ASCAT/ASCAT_v1-0_soil-moisture_daily_0-05deg_2007-2011/00000000/catalog.xml",
    name: "thredds example",
    id: "some unique id"
  }
})
export default class ThreddsCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
