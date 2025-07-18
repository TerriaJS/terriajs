import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { MinMaxLevelTraits } from "./MinMaxLevelTraits";
import UrlTraits from "./UrlTraits";

export class ArcGisSpatialReferenceTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "WKID",
    description: "The well-known ID of the spatial reference."
  })
  wkid?: number;

  @primitiveTrait({
    type: "number",
    name: "Latest WKID",
    description: "The latest well-known ID of the spatial reference."
  })
  latestWkid?: number;
}

export class ArcGisExtentTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Minimum X",
    description: "The minimum X value."
  })
  xmin?: number;

  @primitiveTrait({
    type: "number",
    name: "Minimum Y",
    description: "The minimum Y value."
  })
  ymin?: number;

  @primitiveTrait({
    type: "number",
    name: "Maximum X",
    description: "The maximum X value."
  })
  xmax?: number;

  @primitiveTrait({
    type: "number",
    name: "Maximum Y",
    description: "The maximum Y value."
  })
  ymax?: number;

  @objectTrait({
    type: ArcGisSpatialReferenceTraits,
    name: "Spatial Reference",
    description: "The spatial reference of the extent."
  })
  spatialReference?: ArcGisSpatialReferenceTraits;
}

export class ArcGisMapServerAvailableLayerTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "ID",
    description: "The ID of the layer."
  })
  id?: number;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the layer."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Description",
    description: "The description of the layer."
  })
  description?: string;

  @primitiveTrait({
    type: "string",
    name: "Copyright Text",
    description: "The copyright text of the layer."
  })
  copyrightText?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum Scale",
    description: "The maximum scale of the layer."
  })
  maxScale?: number;

  @objectTrait({
    type: ArcGisExtentTraits,
    name: "Extent",
    description: "The extent of the layer."
  })
  extent?: ArcGisExtentTraits;
}

@traitClass({
  description: `Creates a single item in the catalog from one or many ESRI WMS layers.

  <strong>Note:</strong> <i>The following example does not specify <b>layers</b> property therefore will present all layers in the given URL as single catalog item. To present specific layers only, add them in <b>layers</b> property, e.g. <code>"layers": "AUS_GA_2500k_MiscLines,AUS_GA_2500k_Faults"</code>.</i>`,
  example: {
    url: "https://services.ga.gov.au/gis/rest/services/GA_Surface_Geology/MapServer",
    type: "esri-mapServer",
    name: "Surface Geology"
  }
})
export default class ArcGisMapServerCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  DiscretelyTimeVaryingTraits,
  MinMaxLevelTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Layer(s)",
    description:
      "The layer or layers to display. This can be a comma separated string of layer IDs or names."
  })
  layers?: string;

  @objectArrayTrait({
    name: "Available MapServer Layers",
    description:
      "The available layers in the MapServer. This is a list of layer IDs and names.",
    type: ArcGisMapServerAvailableLayerTraits,
    idProperty: "id"
  })
  availableLayers?: ArcGisMapServerAvailableLayerTraits[];

  @primitiveTrait({
    type: "number",
    name: "Maximum scale",
    description:
      "Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer."
  })
  maximumScale?: number;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the MapServer when requesting images."
  })
  parameters?: JsonObject;

  @primitiveTrait({
    name: "Token URL",
    description: "URL to use for fetching request tokens",
    type: "string"
  })
  tokenUrl?: string;

  @primitiveTrait({
    name: "Token",
    description:
      "Token to use for fetching request tokens (if not using tokenUrl)",
    type: "string"
  })
  token?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range when layer in time-enabled."
  })
  maxRefreshIntervals: number = 10000;

  @primitiveTrait({
    name: "Time Window Duration",
    description:
      "Specify a time window duration when querying a time-enabled layer. Will not query with time window for non-positive value",
    type: "number"
  })
  timeWindowDuration?: number;

  @primitiveTrait({
    name: "Time Window Unit",
    description:
      "The time window unit for the `Time Window Duration`. Any units supported by `moment` module are valid, such as, `year`, `month`, `week`, `day`, `hour`, etc. Will not query time with window if the unit is invalid or undefined.",
    type: "string"
  })
  timeWindowUnit?: string;

  @primitiveTrait({
    name: "Is Forward Time Window",
    description:
      "If true, the time window is forward from the current time. Otherwise backward. Default to forward window.",
    type: "boolean"
  })
  isForwardTimeWindow: boolean = true;

  @primitiveTrait({
    name: "Use Pre-Cached Tiles If Available",
    description:
      "If true, the server's pre-cached tiles are used if they are available. If false, then the MapServer export endpoint will be used. This will default to true if no specific layers are fetched (i.e. all layers are fetched). Otherwise, it will default to false. This will also default to false if parameters have been specified",
    type: "boolean"
  })
  usePreCachedTilesIfAvailable?: boolean;
}
