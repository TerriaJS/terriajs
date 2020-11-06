import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class OpacityTrait extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Opacity",
    description: "The opacity of the item."
  })
  opacity: number = 1.0;
}
