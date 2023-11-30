import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ClippingPlanesTraits from "./ClippingPlanesTraits";
import HighlightColorTraits from "./HighlightColorTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import OpacityTraits from "./OpacityTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import ShadowTraits from "./ShadowTraits";
import SplitterTraits from "./SplitterTraits";
import TransformationTraits from "./TransformationTraits";
import UrlTraits from "./UrlTraits";
import FeaturePickingTraits from "./FeaturePickingTraits";

export class FilterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "A name for the filter"
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "property",
    description: "The name of the feature property to filter"
  })
  property?: string;

  @primitiveTrait({
    type: "number",
    name: "minimumValue",
    description: "Minimum value of the property"
  })
  minimumValue?: number;

  @primitiveTrait({
    type: "number",
    name: "minimumValue",
    description: "Minimum value of the property"
  })
  maximumValue?: number;

  @primitiveTrait({
    type: "number",
    name: "minimumShown",
    description: "The lowest value the property can have if it is to be shown"
  })
  minimumShown?: number;

  @primitiveTrait({
    type: "number",
    name: "minimumValue",
    description: "The largest value the property can have if it is to be shown"
  })
  maximumShown?: number;
}

export class PointCloudShadingTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Attenuation",
    description: "Perform point attenuation based on geometric error."
  })
  attenuation?: boolean;

  @primitiveTrait({
    type: "number",
    name: "geometricErrorScale",
    description: "Scale to be applied to each tile's geometric error."
  })
  geometricErrorScale?: number;
}

export class OptionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Maximum screen space error",
    description:
      "The maximum screen space error used to drive level of detail refinement."
  })
  maximumScreenSpaceError?: number;

  @primitiveTrait({
    type: "number",
    name: "Maximum number of loaded tiles",
    description: ""
  })
  maximumNumberOfLoadedTiles?: number;

  @objectTrait({
    type: PointCloudShadingTraits,
    name: "Point cloud shading",
    description: "Point cloud shading parameters"
  })
  pointCloudShading?: PointCloudShadingTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Show credits on screen",
    description: "Whether to display the credits of this tileset on screen."
  })
  showCreditsOnScreen: boolean = false;
}

export default class Cesium3DTilesTraits extends mixTraits(
  HighlightColorTraits,
  PlaceEditorTraits,
  TransformationTraits,
  FeaturePickingTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits,
  ShadowTraits,
  OpacityTraits,
  LegendOwnerTraits,
  ShadowTraits,
  ClippingPlanesTraits,
  SplitterTraits
) {
  @primitiveTrait({
    type: "number",
    name: "Ion asset ID",
    description: "The Cesium Ion asset id."
  })
  ionAssetId?: number;

  @primitiveTrait({
    type: "string",
    name: "Ion access token",
    description: "Cesium Ion access token id."
  })
  ionAccessToken?: string;

  @primitiveTrait({
    type: "string",
    name: "Ion server",
    description: "URL of the Cesium Ion API server."
  })
  ionServer?: string;

  @objectTrait({
    type: OptionsTraits,
    name: "options",
    description:
      "Additional options to pass to Cesium's Cesium3DTileset constructor."
  })
  options?: OptionsTraits;

  @anyTrait({
    name: "style",
    description:
      "The style to use, specified according to the [Cesium 3D Tiles Styling Language](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling)."
  })
  style?: JsonObject;

  @objectArrayTrait({
    type: FilterTraits,
    idProperty: "name",
    name: "filters",
    description: "The filters to apply to this catalog item."
  })
  filters?: FilterTraits[];

  @primitiveTrait({
    name: "Color blend mode",
    type: "string",
    description:
      "The color blend mode decides how per-feature color is blended with color defined in the tileset. Acceptable values are HIGHLIGHT, MIX & REPLACE as defined in the cesium documentation - https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileColorBlendMode.html"
  })
  colorBlendMode = "MIX";

  @primitiveTrait({
    name: "Color blend amount",
    type: "number",
    description:
      "When the colorBlendMode is MIX this value is used to interpolate between source color and feature color. A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between resulting in a mix of the source color and feature color."
  })
  colorBlendAmount = 0.5;

  @primitiveArrayTrait({
    name: "Feature ID properties",
    type: "string",
    description:
      "One or many properties of a feature that together identify it uniquely. This is useful for setting properties for individual features. eg: ['lat', 'lon'], ['buildingId'] etc."
  })
  featureIdProperties?: string[];
}
