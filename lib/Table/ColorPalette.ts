import colorBrewerTyped from "../../wwwroot/data/colorbrewer.json";
import Color from "terriajs-cesium/Source/Core/Color";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import StandardCssColors from "../Core/StandardCssColors";

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
    if (s === "HighContrast") {
      return new ColorPalette(StandardCssColors.highContrast);
    }
    // First look up a colorbrewer palette
    const cb = colorBrewer[s];

    // Try to match the number of colors exactly.
    const colors = cb && cb[numberOfColors.toString()];
    if (colors !== undefined) {
      return new ColorPalette(colors);
    }

    // Match the palette but not the number of colors?
    if (cb !== undefined) {
      const bins = Object.keys(cb)
        .map(n => Number(n))
        .filter(n => n === n)
        .sort();
      let nextIndex = ~binarySearch(bins, numberOfColors, (a, b) => a - b);
      if (nextIndex >= bins.length) {
        nextIndex = bins.length - 1;
      }
      const nearestColors = cb[bins[nextIndex].toString()];
      if (nearestColors !== undefined) {
        return new ColorPalette(nearestColors);
      }
    }

    // Failing that, interpret as `-` delimited CSS color strings.
    // Add or remove colors as necessary.
    const cssColors = s.split("-");
    return new ColorPalette(cssColors);
  }

  private _colors: Color[];

  constructor(readonly colors: string[]) {
    this._colors = colors.map(color => Color.fromCssColorString(color));
  }

  selectColor(index: number): Color {
    return this._colors[index % this._colors.length];
  }
}
