import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export default class ConstantColorMap extends ColorMap {
  constructor(readonly color: Readonly<Color>) {
    super();
  }

  mapValueToColor(value: number): Readonly<Color> {
    return this.color;
  }
}
