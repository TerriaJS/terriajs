import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export interface ContinuousColorMapOptions {
  readonly nullColor: Readonly<Color>;
  readonly outlierColor: Readonly<Color> | undefined;
  readonly minValue: number;
  readonly maxValue: number;
  readonly colorScale: (t: number) => string;
  readonly isDiverging: boolean;
}

export default class ContinuousColorMap extends ColorMap {
  readonly colorScale: (t: number) => string;
  readonly nullColor: Readonly<Color>;
  readonly outlierColor: Readonly<Color> | undefined;
  readonly minValue: number;
  readonly maxValue: number;
  readonly isDiverging: boolean;

  private readonly colorMapMinValue: number;
  private readonly colorMapMaxValue: number;

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
    this.outlierColor = options.outlierColor;
    this.minValue = options.minValue;
    this.maxValue = options.maxValue;
    this.isDiverging = options.isDiverging;

    // If color scale is diverging
    // We want Math.abs(minValue) === Math.abs(maxValue)
    // This is so the neutral color in the middle of the color map (usually white) is at 0
    if (this.isDiverging) {
      this.colorMapMinValue = this.minValue;
      this.colorMapMaxValue = this.maxValue;
      if (-this.colorMapMinValue > this.colorMapMaxValue) {
        this.colorMapMaxValue = -this.colorMapMinValue;
      } else {
        this.colorMapMinValue = -this.colorMapMaxValue;
      }
    } else {
      this.colorMapMinValue = this.minValue;
      this.colorMapMaxValue = this.maxValue;
    }
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (typeof value !== "number") {
      return this.nullColor;
    }

    // Handle value larger than maxValue
    if (value > this.maxValue)
      return this.outlierColor ?? Color.fromCssColorString(this.colorScale(1));

    // Handle value smaller than minValue
    if (value < this.minValue)
      return this.outlierColor ?? Color.fromCssColorString(this.colorScale(0));

    return Color.fromCssColorString(
      this.colorScale(
        (value - this.colorMapMinValue) /
          (this.colorMapMaxValue - this.colorMapMinValue)
      )
    );
  }
}
