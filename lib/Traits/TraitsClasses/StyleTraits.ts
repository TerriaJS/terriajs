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
    description: "Marker symbol. (only supported with Cesium Primitives)"
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
    description: "Marker URL. (only supported with Cesium Primitives)"
  })
  "marker-url"?: string;

  @primitiveTrait({
    type: "string",
    name: "stroke",
    description: "Stroke color."
  })
  "stroke"?: string;

  @primitiveTrait({
    type: "number",
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
    name: "marker-stroke",
    description:
      "Marker stroke color. (This is will override stroke for Point geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "marker-stroke"?: string;

  @primitiveTrait({
    type: "number",
    name: "marker-stroke-width",
    description:
      "Marker stroke width. (This is will override stroke-width for Point geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "marker-stroke-width"?: number;

  @primitiveTrait({
    type: "string",
    name: "polyline-stroke",
    description:
      "Polyline stroke color. (This is will override stroke for Polyline geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "polyline-stroke"?: string;

  @primitiveTrait({
    type: "number",
    name: "polyline-stroke-width",
    description:
      "Polyline stroke width. (This is will override stroke-width for Polyline geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "polyline-stroke-width"?: number;

  @primitiveTrait({
    type: "string",
    name: "polygon-stroke",
    description:
      "Polygon stroke color. (This is will override stroke for Polygon geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "polygon-stroke"?: string;

  @primitiveTrait({
    type: "number",
    name: "polygon-stroke-width",
    description:
      "Polygon stroke width. (This is will override stroke-width for Polygon geojson-vt features) - not apart of simplestyle-spec and will not apply to cesium primitives"
  })
  "polygon-stroke-width"?: number;

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
