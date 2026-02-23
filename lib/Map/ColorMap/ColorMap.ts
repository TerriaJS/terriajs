import { Color } from "terriajs-cesium";
import JsonValue from "../../Core/Json";

export default abstract class ColorMap {
  abstract mapValueToColor(value: JsonValue | undefined): Readonly<Color>;
}
