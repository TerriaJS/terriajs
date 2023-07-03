/** A collection of functions to map an array of band values at a pixel to an rgb colour */

import chroma from "chroma-js";

// Simply return Hex colour string from RGB. A useful starting point to modify.
export function RGBAToHex(r: number, g: number, b: number) {
  let rString = r.toString(16);
  let gString = g.toString(16);
  let bString = b.toString(16);

  if (rString.length == 1) rString = "0" + rString;
  if (gString.length == 1) gString = "0" + gString;
  if (bString.length == 1) bString = "0" + bString;

  return "#" + rString + gString + bString;
}

export function RBGToYCbCr(values: number[]) {
  const r = Math.round(values[0] + 1.402 * (values[2] - 0x80));
  const g = Math.round(
    values[0] - 0.34414 * (values[1] - 0x80) - 0.71414 * (values[2] - 0x80)
  );
  const b = Math.round(values[0] + 1.772 * (values[1] - 0x80));
  return `rgb(${r},${g},${b})`;
}

export function mapElevationToRgbaSmoothed(
  values: number[],
  waterLevel: number
) {
  // Graduated blues and oranges
  // More examples of colour functions here: https://github.com/GeoTIFF/georaster-layer-for-leaflet/issues/106
  const elevation = values[0];

  const min = -5; // Hardcode min and max, TODO: get from the current part of the returned COG!
  const max = 5;
  const range = 10;

  if (elevation < -50) {
    return "";
  } else if (elevation >= waterLevel) {
    const scale = chroma.scale("oranges").domain([0, 1]);
    const scaledPixelValue = (max - elevation) / range;
    const color = scale(scaledPixelValue).hex();
    return color;
  } else if (elevation < waterLevel) {
    const scale = chroma.scale("blues").domain([1, 0]);
    const scaledPixelValue = (elevation - min) / range;
    const color = scale(scaledPixelValue).hex();
    return color;
  } else {
    return "";
  }
}

export function rgbFromSeparateBands(red: number, green: number, blue: number) {
  // Trying to map values from Int16 to 0-255...
  // const max = Math.pow(2, 14);
  const max = Math.pow(2, 14) / 16; // TODO: Had to divie by 16 to make it look right...  Why?
  red = Math.round((255 * red) / max);
  green = Math.round((255 * green) / max);
  blue = Math.round((255 * blue) / max);

  // make sure no values exceed 255
  red = Math.min(red, 255);
  green = Math.min(green, 255);
  blue = Math.min(blue, 255);

  // treat all black as no data
  if (red === 0 && green === 0 && blue === 0) return null;

  return `rgb(${red}, ${green}, ${blue})`;
}
