import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import LegendTraits from "./LegendTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export class StyleTraits extends ModelTraits {
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

export default class GeoJsonCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description: "Styling rules that follow simplestyle-spec"
  })
  style?: StyleTraits;

  @anyTrait({
    name: "geoJsonData",
    description: "A geojson data object"
  })
  geoJsonData?: JsonObject;

  @primitiveTrait({
    type: "string",
    name: "geoJsonString",
    description: "A geojson string"
  })
  geoJsonString?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this GeoJSON should be clamped to the terrain surface."
  })
  clampToGround: boolean = false;

  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "index"
  })
  legends?: LegendTraits[];
}
