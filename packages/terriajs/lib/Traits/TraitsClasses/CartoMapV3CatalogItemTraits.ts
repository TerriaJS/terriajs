import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { traitClass } from "../Trait";
import { GeoJsonTraits } from "./GeoJsonTraits";

@traitClass({
  description: `Calls Carto V3 API to return GeoJSON. It supports the Query API and the Table API.

To use the Query API - see traits:
- \`cartoQuery\`
- \`cartoGeoColumn\`

To use the Table API - see traits:
- \`cartoTableName\`
- \`cartoColumns\`
- \`cartoGeoColumn\``
})
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
    name: "Authorization token",
    description: "The authorization token to pass to the Carto Maps API"
  })
  connectionName = "carto_dw";

  @primitiveTrait({
    type: "string",
    name: "Base URL",
    description:
      'Base URL for Carto API (eg "https://gcp-australia-southeast1.api.carto.com/")'
  })
  baseUrl = "https://gcp-australia-southeast1.api.carto.com/";

  @primitiveTrait({
    type: "string",
    name: "Geo column name",
    description:
      "Column name of the geom at the table (used for Table and Query API)"
  })
  cartoGeoColumn = "geom";

  @primitiveTrait({
    type: "string",
    name: "Carto SQL Query",
    description:
      "Carto SQL Query (used for Query API). If this is defined, then the Query API will be used instead of Table API."
  })
  cartoQuery?: string;

  @primitiveTrait({
    type: "string",
    name: "Table name",
    description:
      'Table fully qualified name - eg "carto-demo-data.demo_tables.airports". (used for Table API). Note if `cartoQuery` defined, then the Query API will be used instead of Table API.'
  })
  cartoTableName?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Column",
    description:
      "Columns to retrieve from the layer, by default all are returned. (used for Table API)"
  })
  cartoColumns?: string[];
}
