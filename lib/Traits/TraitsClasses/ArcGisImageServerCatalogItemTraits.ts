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
  description: `TODO`,
  example: {
    url: "TODO",
    type: "esri-imageServer",
    name: "Surface Geology"
  }
})
export default class ArcGisImageServerCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  DiscretelyTimeVaryingTraits,
  MinMaxLevelTraits
) {
  @primitiveTrait({
    type: "number",
    name: "Maximum scale",
    description:
      "Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property, will be used and will simply get blurier as the user zooms in closer. Note: maximumLevel overrides this property."
  })
  maximumScale?: number;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the ImageServer when requesting images."
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
    type: "number",
    name: "WKID",
    description:
      "The well-known ID of the spatial reference of the image server. Only Web Mercator (102100 or 102113) and WGS84 (4326) are supported."
  })
  wkid?: number = 102100;

  @primitiveTrait({
    name: "Use Pre-Cached Tiles",
    description:
      "If true, the server's pre-cached tiles are used. If false, then the ImageServer exportImage endpoint will be used. This will default to false if parameters (including time) have been specified, otherwise it will default to true if a server supports pre-cached tiles.",
    type: "boolean"
  })
  usePreCachedTiles?: boolean;

  @primitiveTrait({
    name: "Has Multi-dimensions",
    description: "If true, then multidimensionalInfo will be fetched.",
    type: "boolean"
  })
  hasMultidimensions?: boolean;
}
