import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class LayerOrderingTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Keep on top",
    description: "Keeps the layer on top of all other imagery layers."
  })
  keepOnTop = false;
}
