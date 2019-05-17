import Color from "terriajs-cesium/Source/Core/Color";

export default abstract class ColorMap {
  abstract mapValueToColor(value: number): Color;
}
