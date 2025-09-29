import { exp as interpExp, linear as interpLinear } from "protomaps-leaflet";
import Color from "terriajs-cesium/Source/Core/Color";

const scratchColor = new Color();

export function interpColorsLinear(stops: [number, string][]) {
  return (input: number) => {
    const colorStops = stops.map(([stop, val]) => {
      return [stop, Color.fromCssColorString(val)] as const;
    });
    const reds = colorStops.map(([stop, color]) => [stop, color.red]);
    const greens = colorStops.map(([stop, color]) => [stop, color.green]);
    const blues = colorStops.map(([stop, color]) => [stop, color.blue]);
    const alphas = colorStops.map(([stop, color]) => [stop, color.alpha]);

    scratchColor.red = interpLinear(reds)(input);
    scratchColor.green = interpLinear(greens)(input);
    scratchColor.blue = interpLinear(blues)(input);
    scratchColor.alpha = interpLinear(alphas)(input);
    return scratchColor.toCssColorString();
  };
}

export function interpColorsExp(base: number, stops: [number, string][]) {
  return (input: number) => {
    const colorStops = stops.map(([stop, val]) => {
      return [stop, Color.fromCssColorString(val)] as const;
    });
    const reds = colorStops.map(([stop, color]) => [stop, color.red]);
    const greens = colorStops.map(([stop, color]) => [stop, color.green]);
    const blues = colorStops.map(([stop, color]) => [stop, color.blue]);
    const alphas = colorStops.map(([stop, color]) => [stop, color.alpha]);

    scratchColor.red = interpExp(base, reds)(input);
    scratchColor.green = interpExp(base, greens)(input);
    scratchColor.blue = interpExp(base, blues)(input);
    scratchColor.alpha = interpExp(base, alphas)(input);
    return scratchColor.toCssColorString();
  };
}
