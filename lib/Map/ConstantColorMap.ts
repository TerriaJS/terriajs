import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export default class ConstantColorMap extends ColorMap {
  constructor(readonly color: Readonly<Color>, readonly title?: string) {
    super();
  }

  mapValueToColor(
    value: number | null | undefined
  ): Readonly<Color> | undefined {
    return this.color;
  }
}
