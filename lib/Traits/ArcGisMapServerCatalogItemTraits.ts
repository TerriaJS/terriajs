import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import MappableTraits from "./MappableTraits";
import DataCustodianTraits from "./DataCustodianTraits";
import LegendTraits from "./LegendTraits";
import objectArrayTrait from "./objectArrayTrait";
import SplitterTraits from "./SplitterTraits";
import anyTrait from "./anyTrait";
import objectTrait from "./objectTrait";
import { JsonObject } from "../Core/Json";

export default class ArcGisMapServerCatalogItemTraits extends mixTraits(
  SplitterTraits,
  DataCustodianTraits,
  RasterLayerTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Layer(s)",
    description: "The layer or layers to display."
  })
  layers?: string;

  @primitiveTrait({
    type: "number",
    name: "Maximum scale",
    description:
      "Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer."
  })
  maximumScale?: number;

  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "index"
  })
  legends?: LegendTraits[];

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
}
