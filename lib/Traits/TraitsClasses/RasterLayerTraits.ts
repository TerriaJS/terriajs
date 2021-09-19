import ModelTraits from "../ModelTraits";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import SplitterTraits from "./SplitterTraits";
import mixTraits from "../mixTraits";

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

export default class RasterLayerTraits extends mixTraits(SplitterTraits) {
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
    thresholdBeforeDisablingItem: 5,
    treat403AsError: true,
    treat404AsError: false,
    ignoreUnknownTileErrors: false
  };

  @primitiveTrait({
    type: "boolean",
    name: "Clip to rectangle",
    description: `Gets or sets a value indicating whether this dataset should be clipped to the {@link CatalogItem#rectangle}.
If true, no part of the dataset will be displayed outside the rectangle.
This property is true by default, leading to better performance and avoiding tile request errors that might occur when requesting tiles outside the server-specified rectangle.
However, it may also cause features to be cut off in some cases, such as if a server reports an extent that does not take into account that the representation of features sometimes require a larger spatial extent than the features themselves.
For example, if a point feature on the edge of the extent is drawn as a circle with a radius of 5 pixels, half of that circle will be cut off.`
  })
  clipToRectangle: boolean = true;
}
