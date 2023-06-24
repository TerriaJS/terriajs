import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class LayerOrderingTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Keep on top",
    description: "Keeps the layer on top of all other imagery layers."
  })
  keepOnTop = false;

  @primitiveTrait({
    type: "boolean",
    name: "Supports reordering",
    description: "Does this layer support reordering in the workbench."
  })
  supportsReordering = true;
}
