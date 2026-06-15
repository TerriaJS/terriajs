import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";
import isDefined from "../../Core/isDefined";

export interface EnumColorMapOptions {
  readonly color: Readonly<Color>;
  readonly title?: string;
  readonly nullColor?: Readonly<Color>;
}

export default class ConstantColorMap extends ColorMap {
  readonly color: Readonly<Color>;
  readonly title?: string;
  readonly nullColor?: Readonly<Color>;

  constructor(options: EnumColorMapOptions) {
    super();
    this.color = options.color;
    this.title = options.title;
    this.nullColor = options.nullColor;
  }

  mapValueToColor(value: number | null | undefined): Readonly<Color> {
    if (this.nullColor && (value === null || !isDefined(value)))
      return this.nullColor;
    return this.color;
  }
}
