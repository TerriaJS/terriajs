import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "./ColorMap";

export interface ColorStop {
  readonly offset: number;
  readonly color: Color;
}

const color = Color.fromBytes;
const defaultColorStops: ColorStop[] = [
  { offset: 0.0, color: color(239, 210, 193, 255) },
  { offset: 0.25, color: color(221, 139, 116, 255) },
  { offset: 0.5, color: color(255, 127, 46, 255) },
  { offset: 0.75, color: color(255, 65, 43, 255) },
  { offset: 1.0, color: color(111, 0, 54, 255) }
];

export interface ContinuousColorMapOptions {
  maximumValue: number;
  minimumValue: number;
  colorStops?: ColorStop[];
  nullColor: Readonly<Color>;
}

export default class ContinuousColorMap extends ColorMap {
  readonly maximumValue: number;
  readonly minimumValue: number;
  readonly colorStops: ColorStop[];
  readonly gradient: ImageData | undefined;
  readonly nullColor: Color;

  constructor(options: ContinuousColorMapOptions) {
    super();

    this.maximumValue = options.maximumValue;
    this.minimumValue = options.minimumValue;
    this.colorStops = options.colorStops || defaultColorStops;
    this.gradient = buildColorGradient(this.colorStops);
    this.nullColor = options.nullColor;
  }

  mapValueToColor(value: string | number | null | undefined): Readonly<Color> {
    if (!this.gradient || typeof value !== "number") {
      return this.nullColor;
    }
    const color = getColorFromGradient(
      this.gradient,
      this.getFractionalValue(value)
    );
    return color;
  }

  getFractionalValue(value: number) {
    const f =
      this.maximumValue === this.minimumValue
        ? 0
        : (value - this.minimumValue) / (this.maximumValue - this.minimumValue);
    // if (legendHelper.tableColumnStyle.clampDisplayValue) {
    //   f = Math.max(0.0, Math.min(1.0, f));
    // }
    return f;
  }
}

function buildColorGradient(colorStops: ColorStop[]) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = 64);
  const h = (canvas.height = 256);
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }

  // Create Linear Gradient
  const linGrad = ctx.createLinearGradient(0, 0, 0, h - 1);
  colorStops.forEach(({ offset, color }) => {
    console.log(offset, color.toCssColorString());
    linGrad.addColorStop(offset, color.toCssColorString());
  });
  ctx.fillStyle = linGrad;
  ctx.fillRect(0, 0, w, h);

  const image = ctx.getImageData(0, 0, 1, 256);
  return image;
}

function getColorFromGradient(
  colorGradient: ImageData,
  fractionalPosition: number
) {
  const colorIndex =
    Math.floor(fractionalPosition * (colorGradient.data.length / 4 - 1)) * 4;
  console.log(fractionalPosition, colorIndex);
  return new Color(
    colorGradient.data[colorIndex],
    colorGradient.data[colorIndex + 1],
    colorGradient.data[colorIndex + 2],
    colorGradient.data[colorIndex + 3]
  );
}
