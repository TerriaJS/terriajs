import colorBrewerTyped from "../../wwwroot/data/colorbrewer.json";
import Color from "terriajs-cesium/Source/Core/Color";

interface ColorBrewer {
  [name: string]:
    | {
        [number: string]: string[] | undefined;
      }
    | undefined;
}
const colorBrewer = <ColorBrewer>(<unknown>colorBrewerTyped);

const defaultColor = "black";

export default class ColorPalette {
  static fromString(s: string, numberOfColors: number): ColorPalette {
    // First look up a colorbrewer palette
    const cb = colorBrewer[s];
    const colors = cb && cb[numberOfColors.toString()];
    if (colors !== undefined) {
      return new ColorPalette(colors);
    }

    // Failing that, interpret as `-` delimited CSS color strings.
    // Add or remove colors as necessary.
    const cssColors = s.split("-");
    while (cssColors.length < numberOfColors) {
      cssColors.push(defaultColor);
    }
    if (cssColors.length > numberOfColors) {
      cssColors.splice(numberOfColors, cssColors.length - numberOfColors);
    }
    return new ColorPalette(cssColors);
  }

  private _colors: Color[];

  constructor(readonly colors: string[]) {
    this._colors = colors.map(color => Color.fromCssColorString(color));
  }

  selectColor(index: number): Color {
    return this._colors[index];
  }
}
