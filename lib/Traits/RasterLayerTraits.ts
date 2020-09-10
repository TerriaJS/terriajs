import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";

export class TileErrorHandlingTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "tileErrorThresholdBeforeDisabling",
    description: "The number of tile failures before disabling the item."
  })
  thresholdBeforeDisablingItem?: number;

  @primitiveTrait({
    type: "boolean",
    name: "treat403AsError",
    description:
      "Indicates whether a 403 response code when requesting a tile should be treated as an error. If false, 403s are assumed to just be missing tiles and need not be reported to the user."
  })
  treat403AsError?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "treat404AsError",
    description:
      "Indicates whether a 404 response code when requesting a tile should be treated as an error. If false, 404s are assumed to just be missing tiles and need not be reported to the user."
  })
  treat404AsError?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "ignoreUnknownTileErrors",
    description:
      "A flag indicating whether non-specific (no HTTP status code) tile errors should be ignored. This is a last resort, for dealing with odd cases such as data sources that return non-images (eg XML) with a 200 status code. No error messages will be shown to the user."
  })
  ignoreUnknownTileErrors?: boolean;
}

export default class RasterLayerTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Opacity",
    description: "The opacity of the map layers."
  })
  opacity: number = 0.8;

  @primitiveTrait({
    type: "number",
    name: "Leaflet update interval",
    description:
      "Update a tile only once during this interval when the map is panned. Value should be specified in milliseconds."
  })
  leafletUpdateInterval?: number;

  @objectTrait({
    type: TileErrorHandlingTraits,
    name: "tileErrorHandling",
    description: "Options for handling tile errors"
  })
  tileErrorHandlingOptions: TileErrorHandlingTraits = {
    thresholdBeforeDisablingItem: 0,
    treat403AsError: true,
    treat404AsError: false,
    ignoreUnknownTileErrors: false
  };
}
