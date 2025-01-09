import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeaturePickingTraits from "./FeaturePickingTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a single item in the catalog from one ESRI WFS layer.

  <strong>Note:</strong> <i>Must specify <b>layer ID</b>, e.g. <code>/0</code>, in the URL path.</i>`,
  example: {
    url: "https://services5.arcgis.com/OvOcYIrJnM97ABBA/arcgis/rest/services/Australian_Public_Hospitals_WFL1/FeatureServer/0",
    type: "esri-featureServer",
    name: "Australian Public Hospitals",
    id: "some id"
  }
})
export default class ArcGisFeatureServerCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  GeoJsonTraits,
  FeaturePickingTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this service should be clamped to the terrain surface."
  })
  clampToGround: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Use style information from service",
    description:
      "Whether to symbolise the data using the drawingInfo object available in the service endpoint."
  })
  useStyleInformationFromService: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "layerDef",
    description:
      "DEPRECATED, use `where` instead. The 'layerDef' string to pass to the server when requesting geometry."
  })
  layerDef: string = "1=1";

  @primitiveTrait({
    type: "string",
    name: "Where clause",
    description:
      "The 'where' string to pass to the server when requesting geometry."
  })
  where: string = "1=1";

  @primitiveTrait({
    type: "number",
    name: "Maximum features",
    description:
      "The maximum number of features to be retrieved from the feature service."
  })
  maxFeatures: number = 5000;

  @primitiveTrait({
    type: "number",
    name: "Features per request",
    description:
      "The number of features to be retrieved from the feature service in each request. This should be equal to the " +
      "maxRecordCount specified by the server."
  })
  featuresPerRequest: number = 1000;

  @primitiveTrait({
    type: "boolean",
    name: "Supports pagination",
    description:
      "Whether this feature service supports pagination. By default, this will be inferred from the server's response."
  })
  supportsPagination?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Tile requests",
    description:
      "Whether this feature service supports tiled requests. By default, this will be inferred from the server's response."
  })
  tileRequests: boolean = true;

  @primitiveTrait({
    type: "number",
    name: "Maximum features",
    description:
      "For each tile, the maximum number of features to be retrieved from the feature service."
  })
  maxTiledFeatures: number = 100000;

  @primitiveTrait({
    type: "number",
    name: "Tile maximum scale",
    description:
      "Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer."
  })
  tileMaximumScale?: number;

  @primitiveTrait({
    type: "number",
    name: "Tile minimum scale",
    description:
      "Gets or sets the denominator of the smallest scale (largest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale smaller than 1:1000 (i.e. numerically larger denominator, when zooming in closer) will not be requested."
  })
  tileMinimumScale?: number;

  @primitiveTrait({
    type: "number",
    name: "Features per request",
    description:
      "The number of features to be retrieved from the feature service in each request. This should be equal to the " +
      "tileMaxRecordCount specified by the server."
  })
  featuresPerTileRequest: number = 4000;

  @primitiveTrait({
    type: "number",
    name: "maxRecordCountFactor",
    description:
      "When set, the maximum number of features returned by the query will equal the maxRecordCount of the service multiplied by this factor. This only applies to tiled requests"
  })
  maxRecordCountFactor: number = 1;

  @primitiveTrait({
    type: "boolean",
    name: "Tile requests",
    description:
      "Whether this feature service supports tiled requests. By default, this will be inferred from the server's response."
  })
  supportsQuantization: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Object ID Field",
    description:
      "The field in the feature service that contains the unique identifier for each feature."
  })
  objectIdField: string = "OBJECTID";

  @primitiveArrayTrait({
    type: "string",
    name: "Out Fields",
    description:
      "The fields to be included in the response from the feature service. This will default to the object ID field, and include any fields required for styling."
  })
  outFields: string[] = ["OBJECTID"];

  @primitiveTrait({
    type: "boolean",
    name: "Show in ArcGIS Web Viewer",
    description:
      "Whether to show a button in the catalog item that opens this item in the ArcGIS Web Viewer."
  })
  showOpenInArcGisWebViewer: boolean = false;
}
