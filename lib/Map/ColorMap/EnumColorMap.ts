import ColorMap from "./ColorMap";
import Color from "terriajs-cesium/Source/Core/Color";

export interface EnumBin {
  readonly value: string;
  readonly color: Readonly<Color>;
}

export interface EnumColorMapOptions {
  readonly enumColors: readonly EnumBin[];
  readonly nullColor: Readonly<Color>;
}

export default class EnumColorMap extends ColorMap {
  values: readonly string[];
  colors: readonly Readonly<Color>[];
  nullColor: Readonly<Color>;

  constructor(options: EnumColorMapOptions) {
    super();

    this.nullColor = Color.clone(options.nullColor);
    const values: string[] = [];
    const colors: Readonly<Color>[] = [];

    options.enumColors.forEach((bin) => {
      values.push(bin.value);
      colors.push(Color.clone(bin.color));
    });

    this.values = values;
    this.colors = colors;
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (value === undefined || value === null) {
      return this.nullColor;
    } else if (typeof value !== "string") {
      value = value.toString();
    }

    const values = this.values;
    let i, len;
    for (let i = 0, len = values.length; i < len; ++i) {
      if (values[i] === value) {
        return this.colors[i];
      }
    }

    return this.nullColor;
  }
}
