import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class StyleTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "marker-size",
    description:
      "Marker size. Valid values are `small`, `medium`, or `large`. If the " +
      "value is a number, it is the size in pixels."
  })
  "marker-size"?: string;

  @primitiveTrait({
    type: "string",
    name: "marker-color",
    description: "Marker color"
  })
  "marker-color"?: string;

  @primitiveTrait({
    type: "string",
    name: "marker-symbol",
    description: "Marker symbol."
  })
  "marker-symbol"?: string;

  @primitiveTrait({
    type: "number",
    name: "marker-opacity",
    description: "Marker opacity."
  })
  "marker-opacity"?: number;

  @primitiveTrait({
    type: "string",
    name: "marker-url",
    description: "Marker URL."
  })
  "marker-url"?: string;

  @primitiveTrait({
    type: "string",
    name: "stroke",
    description: "Stroke color."
  })
  "stroke"?: string;

  @primitiveTrait({
    type: "string",
    name: "stroke-opacity",
    description: "Stroke opacity."
  })
  "stroke-opacity"?: number;

  @primitiveTrait({
    type: "number",
    name: "stroke-width",
    description: "Stroke width."
  })
  "stroke-width"?: number;

  @primitiveTrait({
    type: "string",
    name: "fill",
    description: "Fill color."
  })
  "fill"?: string;

  @primitiveTrait({
    type: "number",
    name: "fill-opacity",
    description: "Fill opacity."
  })
  "fill-opacity"?: number;
}
