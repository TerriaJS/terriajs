import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Result from "../../Core/Result";
import Model from "../../Models/Definition/Model";
import updateModelFromJson from "../../Models/Definition/updateModelFromJson";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

const cartoScratch = new Cartographic();

export default class LatLonHeightTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Latitude",
    description: "Latitude in degrees"
  })
  latitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Longitude",
    description: "Longitude in degrees"
  })
  longitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Height",
    description: "Height above ellipsoid in metres"
  })
  height?: number;

  static setFromCartesian(
    model: Model<LatLonHeightTraits>,
    stratumName: string,
    position: Cartesian3
  ): Result<undefined> {
    const cartographic = Cartographic.fromCartesian(
      position,
      undefined,
      cartoScratch
    );
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const height = cartographic.height;
    return updateModelFromJson(model, stratumName, {
      latitude,
      longitude,
      height
    });
  }

  static toCartographic(
    model: Model<LatLonHeightTraits>,
    result?: Cartographic
  ): Cartographic | undefined {
    const { longitude, latitude, height } = model;
    if (
      longitude === undefined ||
      latitude === undefined ||
      height === undefined
    ) {
      return undefined;
    }

    return Cartographic.fromDegrees(
      longitude,
      latitude,
      height,
      result ?? new Cartographic()
    );
  }

  static toCartesian(
    model: Model<LatLonHeightTraits>,
    result?: Cartesian3
  ): Cartesian3 | undefined {
    const { longitude, latitude, height } = model;
    if (
      longitude === undefined ||
      latitude === undefined ||
      height === undefined
    ) {
      return;
    }

    return Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
      undefined,
      result ?? new Cartesian3()
    );
  }
}
