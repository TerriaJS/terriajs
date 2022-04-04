import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import updateModelFromJson from "../../Models/Definition/updateModelFromJson";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Model from "../../Models/Definition/Model";

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

  static setFromRotationMatrix(
    model: Model<HeadingPitchRollTraits>,
    stratumId: string,
    rotation: Matrix3
  ) {
    const hpr = HeadingPitchRoll.fromQuaternion(
      Quaternion.fromRotationMatrix(rotation)
    );
    updateModelFromJson(model, stratumId, {
      heading: CesiumMath.toDegrees(hpr.heading),
      pitch: CesiumMath.toDegrees(hpr.pitch),
      roll: CesiumMath.toDegrees(hpr.roll)
    });
    return hpr;
  }
}
