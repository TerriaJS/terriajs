import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

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
  includeMinimumInThisBin: readonly boolean[];
  maximums: readonly number[];
  colors: readonly Readonly<Color>[];
  nullColor: Readonly<Color>;

  constructor(options: DiscreteColorMapOptions) {
    super();

    const includeMinimumInThisBin: boolean[] = [];
    const maximums: number[] = [];
    const colors: Color[] = [];

    options.bins.forEach((bin) => {
      maximums.push(bin.maximum);
      includeMinimumInThisBin.push(bin.includeMinimumInThisBin);
      colors.push(Color.clone(bin.color));
    });

    this.includeMinimumInThisBin = [];
    this.maximums = maximums;
    this.colors = colors;
    this.nullColor = Color.clone(options.nullColor);
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (typeof value !== "number") {
      return this.nullColor;
    }

    const maximums = this.maximums;
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
      i < this.includeMinimumInThisBin.length - 1 &&
      this.includeMinimumInThisBin[i + 1]
    ) {
      ++i;
    }

    return this.colors[i];
  }
}
