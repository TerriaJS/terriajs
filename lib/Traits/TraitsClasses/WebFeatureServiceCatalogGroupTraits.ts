import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a single item in the catalog from url that points to WFS service.

  <strong>Note:</strong> <i>Must specify property <b>typeNames</b>.</i>`,
  example: {
    "type": "wfs",
    "name": "wfs example",
    "url": "https://warehouse.ausseabed.gov.au/geoserver/ows",
    "typeNames": "ausseabed:AHO_Reference_Surface__Broome__2023_0_5m_L0_Coverage",
    "id": "some unique id for wfs example"
  }
})
export default class WebFeatureServiceCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {}
