import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import UrlTraits from "./UrlTraits";

export default class ArcGisMapServerCatalogItemTraits extends mixTraits(
  MappableTraits,
  FeatureInfoTraits,
  RasterLayerTraits,
  LayerOrderingTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits,
  DiscretelyTimeVaryingTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Layer(s)",
    description:
      "The layer or layers to display. This can be a comma seperated string of layer IDs or names."
  })
  layers?: string;

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
    name: "Allow feature picking",
    type: "boolean",
    description:
      "Indicates whether features in this catalog item can be selected by clicking them on the map."
  })
  allowFeaturePicking = true;

  @primitiveTrait({
    name: "Maximum scale before showing a message",
    description:
      "The denominator of the largest scale (smallest denominator) beyond which to show a message explaining that no further zoom levels are available, at the request",
    type: "number"
  })
  maximumScaleBeforeMessage?: number;

  @primitiveTrait({
    name: "Show tiles after message",
    description:
      "Value indicating whether to continue showing tiles when the `maximumScaleBeforeMessage` is exceeded.",
    type: "boolean"
  })
  showTilesAfterMessage = true;

  @primitiveTrait({
    name: "Token URL",
    description: "URL to use for fetching request tokens",
    type: "string"
  })
  tokenUrl?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range when layer in time-enabled."
  })
  maxRefreshIntervals: number = 1000;
}
