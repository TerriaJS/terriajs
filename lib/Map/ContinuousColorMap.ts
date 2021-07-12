import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export interface ContinuousColorMapOptions {
  readonly nullColor: Readonly<Color>;
  readonly minValue: number;
  readonly maxValue: number;
  readonly colorScale: (t: number) => string;
}

export default class ContinuousColorMap extends ColorMap {
  readonly colorScale: (t: number) => string;
  readonly nullColor: Readonly<Color>;
  readonly minValue: number;
  readonly maxValue: number;

  constructor(options: ContinuousColorMapOptions) {
    super();

    if (options.minValue === options.maxValue) {
      throw `Minimum and maximum values must be different.`;
    }

    if (options.minValue > options.maxValue) {
      throw `Minimum value must be less than the maximum value.`;
    }

    this.colorScale = options.colorScale;
    this.nullColor = options.nullColor;
    this.minValue = options.minValue;
    this.maxValue = options.maxValue;
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (typeof value !== "number") {
      return this.nullColor;
    }

    return Color.fromCssColorString(
      this.colorScale((value - this.minValue) / (this.maxValue - this.minValue))
    );
  }
}
