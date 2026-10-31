import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import { round5 } from "./round5";

const scratchCartographic = new Cartographic();

export const toLatLonDegrees = (position: Cartographic | Cartesian3) => {
  const cartographic =
    position instanceof Cartesian3
      ? Cartographic.fromCartesian(position, undefined, scratchCartographic)
      : position;

  return [
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude),
    cartographic.height
  ].map(round5);
};
