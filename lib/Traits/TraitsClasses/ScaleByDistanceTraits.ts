import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ScaleByDistanceTraits extends ModelTraits {
  @primitiveTrait({
    name: "Near",
    description: "The lower bound of the camera distance range.",
    type: "number"
  })
  near = 0.0;

  @primitiveTrait({
    name: "Near Scale Value",
    description:
      "The scale value to use when the camera is at the `Near` distance (or " +
      "closer). A value greater than 1.0 enlarges the image while a scale " +
      "less than 1.0 shrinks it.",
    type: "number"
  })
  nearValue = 1.0;

  @primitiveTrait({
    name: "Far",
    description: "The upper bound of the camera distance range.",
    type: "number"
  })
  far = 1.0;

  @primitiveTrait({
    name: "Far Scale Value",
    description:
      "The scale value to use when the camera is at the `Far` distance (or " +
      "farther). A value greater than 1.0 enlarges the image while a scale " +
      "less than 1.0 shrinks it.",
    type: "number"
  })
  farValue = 1.0;
}
