import * as d3Scale from "d3-scale-chromatic";
import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export interface ContinuousColorMapOptions {
  readonly palette: string;
  readonly nullColor: Readonly<Color>;
  readonly minValue: number;
  readonly maxValue: number;
}

export default class ContinuousColorMap extends ColorMap {
  readonly palette: string;
  readonly colorScale: (t: number) => string;
  readonly nullColor: Readonly<Color>;
  readonly minValue: number;
  readonly maxValue: number;

  constructor(options: ContinuousColorMapOptions) {
    super();

    const colorScale = (d3Scale as any)[`interpolate${options.palette}`];

    if (typeof colorScale !== "function")
      throw `Color palette "${options.palette}" is not valid.`;

    if (options.minValue === options.maxValue) {
      throw `Minimum and maximum values must be different.`;
    }

    if (options.minValue > options.maxValue) {
      throw `Minimum value must be less than the maximum value.`;
    }

    this.palette = options.palette;
    this.colorScale = colorScale;
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
