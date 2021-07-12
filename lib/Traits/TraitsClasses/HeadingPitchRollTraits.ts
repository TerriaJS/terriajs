import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class HeadingPitchRollTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Heading",
    description: "Heading in degrees"
  })
  heading?: number;

  @primitiveTrait({
    type: "number",
    name: "Pitch",
    description: "Pitch in degrees"
  })
  pitch?: number;

  @primitiveTrait({
    type: "number",
    name: "Roll",
    description: "Roll in degrees"
  })
  roll?: number;
}
