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
}
