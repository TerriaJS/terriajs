import ColorMap from "./ColorMap";
import Color from "terriajs-cesium/Source/Core/Color";

export interface DiscreteBin {
  readonly includeMinimumInThisBin: boolean;
  readonly maximum: number;
  readonly color: Readonly<Color>;
}

export interface DiscreteColorMapOptions {
  readonly bins: readonly DiscreteBin[];
  readonly nullColor: Readonly<Color>;
}

export default class DiscreteColorMap extends ColorMap {
  private _includeMinimumInThisBin: boolean[];
  private _maximums: number[];
  private _colors: Color[];
  private _nullColor: Color;

  constructor(options: DiscreteColorMapOptions) {
    super();

    this._nullColor = Color.clone(options.nullColor);
    this._includeMinimumInThisBin = [];
    this._maximums = [];
    this._colors = [];

    options.bins.forEach(bin => {
      this._maximums.push(bin.maximum);
      this._includeMinimumInThisBin.push(bin.includeMinimumInThisBin);
      this._colors.push(Color.clone(bin.color));
    });
  }

  mapValueToColor(value: number | null | undefined): Readonly<Color> {
    if (value === undefined || value === null) {
      return this._nullColor;
    }

    const maximums = this._maximums;
    let i, len;
    for (
      i = 0, len = maximums.length - 1;
      i < len && value > maximums[i];
      ++i
    ) {}

    // Value may equal maximum, in which case we look at
    // `includeMinimumInThisBin` for the _next_ bin.
    if (
      value === maximums[i] &&
      i < this._includeMinimumInThisBin.length - 1 &&
      this._includeMinimumInThisBin[i + 1]
    ) {
      ++i;
    }

    return this._colors[i];
  }
}
