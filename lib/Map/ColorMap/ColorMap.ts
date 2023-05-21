import { Color } from "cesium";

export default abstract class ColorMap {
  abstract mapValueToColor(
    value: string | number | null | undefined
  ): Readonly<Color>;
}
