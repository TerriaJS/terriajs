import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import StyleTraits from "./StyleTraits";

// TODO: this is repeated in two files, WMS and WFS. In a global config somewhere?
export const SUPPORTED_CRS_4326 = [
  "EPSG:4326",
  "urn:ogc:def:crs:EPSG::4326",
  "urn:x-ogc:def:crs:EPSG:4326",
  "CRS:84",
  "EPSG:4283"
];

export const SUPPORTED_CRS_3857 = [
  "EPSG:3857",
  "urn:ogc:def:crs:EPSG::3857",
  "urn:x-ogc:def:crs:EPSG:3857",
  "EPSG:900913",
  "urn:ogc:def:crs:EPSG::900913",
  "urn:x-ogc:def:crs:EPSG:900913"
];

@traitClass({
  description: `Creates a single item in the catalog from url that points to a WFS service.
  <strong>Note:</strong> <i>Must specify property <b>typeNames</b>.</i>`,
  example: {
    type: "wfs",
    name: "wfs example",
    url: "https://warehouse.ausseabed.gov.au/geoserver/ows",
    typeNames: "ausseabed:AHO_Reference_Surface__Broome__2023_0_5m_L0_Coverage",
    id: "some unique id for wfs example"
  }
})
export default class WebFeatureServiceCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  GetCapabilitiesTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Type Name(s)",
    description: "The type name or names to display."
  })
  typeNames?: string;

  @primitiveTrait({
    type: "number",
    name: "Max features",
    description: "Maximum number of features to display."
  })
  maxFeatures = 1000;

  @primitiveTrait({
    type: "string",
    name: "Srs Name",
    description: `Spatial Reference System to use. For WFS we prefer WGS 84 (${SUPPORTED_CRS_4326.join(
      ", "
    )}). With WFS requests it is best to use the urn identifier for the srsName, to enforce lat,long order in returned results.`
  })
  srsName?: string;

  @primitiveTrait({
    type: "string",
    name: "Output Format",
    description:
      "Output format to request for WFS requests. We prefer GeoJSON. We support gml3 and gml3.1.1 but only in EPSG:4326 projection or similar."
  })
  outputFormat?: string;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the WFS Server when requesting features."
  })
  parameters?: JsonObject;

  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits = undefined;
}
