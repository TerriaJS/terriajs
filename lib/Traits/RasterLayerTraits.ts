import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

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
