import primitiveTrait from "./Decorators/primitiveTrait";
import ModelTraits from "./ModelTraits";

export default class OpacityTrait extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Opacity",
    description: "The opacity of the item."
  })
  opacity: number = 0.8;
}
