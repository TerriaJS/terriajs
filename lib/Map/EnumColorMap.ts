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
  private _values: string[];
  private _colors: Color[];
  private _nullColor: Color;

  constructor(options: EnumColorMapOptions) {
    super();

    this._nullColor = Color.clone(options.nullColor);
    this._values = [];
    this._colors = [];

    options.enumColors.forEach(bin => {
      this._values.push(bin.value);
      this._colors.push(Color.clone(bin.color));
    });
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (value === undefined || value === null) {
      return this._nullColor;
    } else if (typeof value !== 'string') {
      value = value.toString();
    }

    const values = this._values;
    let i, len;
    for (let i = 0, len = values.length; i < len; ++i) {
      if (values[i] === value) {
        return this._colors[i];
      }
    }

    return this._nullColor;
  }
}
