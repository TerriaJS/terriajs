import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class RasterLayerTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Opacity",
    description: "The opacity of the map layers."
  })
  opacity: number = 0.8;
}
