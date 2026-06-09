import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a group of all layers in the catalog from a url that points to a WFS service.`,
  example: {
    type: "wfs-group",
    name: "wfs-group example",
    url: "https://warehouse.ausseabed.gov.au/geoserver/ows",
    id: "some unique id for wfs-group example"
  }
})
export default class WebFeatureServiceCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
