import ColorMap from "./ColorMap";
import Color from "terriajs-cesium/Source/Core/Color";

export interface DiscreteColorMapOptions {}

export default class DiscreteColorMap extends ColorMap {
  constructor(options: DiscreteColorMapOptions) {
    super();
  }

  mapValueToColor(value: number): Color {
    throw new Error("Method not implemented.");
  }
}
