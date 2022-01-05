import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";

export default class SocrataMapViewCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "GeoJSON URL",
    description: "The URL to use to download geoJSON."
  })
  geojsonUrl?: string;

  @primitiveTrait({
    type: "string",
    name: "Resource ID",
    description:
      "Resource ID to use when querying views. For example `https://data.melbourne.vic.gov.au/views/${resourceId}`"
  })
  resourceId?: string;
}
