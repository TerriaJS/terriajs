import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class OpacityTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Opacity",
    description: "The opacity of the item."
  })
  opacity: number = 0.8;

  @primitiveTrait({
    type: "boolean",
    name: "Disable opacity control",
    description:
      "When true, the user will be unable to change the opacity of the item"
  })
  disableOpacityControl: boolean = false;
}
