import ModelTraits from "../ModelTraits";
import objectTrait from "../Decorators/objectTrait";
import LatLonHeightTraits from "./LatLonHeightTraits";
import HeadingPitchRollTraits from "./HeadingPitchRollTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class TransformationTraits extends ModelTraits {
  @objectTrait({
    type: LatLonHeightTraits,
    name: "Origin",
    description:
      "The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame."
  })
  origin?: LatLonHeightTraits;

  @objectTrait({
    type: HeadingPitchRollTraits,
    name: "Rotation",
    description:
      "The rotation of the model expressed as heading, pitch and roll in the local frame of reference. Defaults to zero rotation."
  })
  rotation?: HeadingPitchRollTraits;

  @primitiveTrait({
    type: "number",
    name: "Scale",
    description: "The scale factor to apply to the model"
  })
  scale?: number;
}
