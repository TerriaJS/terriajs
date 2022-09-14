import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";

export default class CartoMapV3TableCatalogItemTraits extends mixTraits(
  GeoJsonTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Access token",
    description: "The access token to pass to the Carto Maps API"
  })
  accessToken?: string;

  @primitiveTrait({
    type: "string",
    name: "Base URL",
    description:
      'Base URL for Carto API (eg "https://gcp-us-east1.api.carto.com/")'
  })
  baseUrl = "https://gcp-us-east1.api.carto.com/";

  @primitiveTrait({
    type: "string",
    name: "Geo column name",
    description: "Column name of the geom at the table"
  })
  cartoGeoColumn = "geom";

  @primitiveTrait({
    type: "string",
    name: "Table name",
    description:
      'Table fully qualified name (eg "carto-demo-data.demo_tables.airports")'
  })
  cartoTableName?: string;

  @primitiveTrait({
    type: "string",
    name: "Authorization token",
    description: "The authorization token to pass to the Carto Maps API"
  })
  connectionName = "carto_dw";

  @primitiveArrayTrait({
    type: "string",
    name: "Column",
    description:
      "Columns to retrieve from the layer, by default all are returned"
  })
  cartoColumns?: string[];
}
