import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class FeaturePickingTraits extends ModelTraits {
  @primitiveTrait({
    name: "Allow feature picking",
    type: "boolean",
    description:
      "Indicates whether features in this catalog item can be selected by clicking them on the map."
  })
  allowFeaturePicking = true;
}
