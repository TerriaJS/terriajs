import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { MinMaxLevelTraits } from "./MinMaxLevelTraits";
import UrlTraits from "./UrlTraits";

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
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range when layer in time-enabled."
  })
  maxRefreshIntervals: number = 1000;

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
}
