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
import CesiumIonTraits from "./CesiumIonTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";

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

  @primitiveTrait({
    type: "boolean",
    name: "Asynchronously load draped imageries",
    description:
      "When true, Cesium does not wait for the draped imagery layers to load before the tileset mesh is rendered. This means while the imagery is being loaded the original tile texture will be shown."
  })
  asynchronouslyLoadImagery: boolean = true;

  @primitiveTrait({
    type: "number",
    name: "Dynamic screen space error density",
    description:
      "Density used to adjust the dynamic screen space error, similar to fog density."
  })
  dynamicScreenSpaceErrorDensity?: number;

  @primitiveTrait({
    type: "number",
    name: "Dynamic screen space error factor",
    description:
      "A factor used to increase the screen space error of tiles for the dynamic screen space error optimization."
  })
  dynamicScreenSpaceErrorFactor?: number;

  @primitiveTrait({
    type: "number",
    name: "Dynamic screen space error height falloff",
    description:
      "A ratio of the tileset's height that determines the height at which the dynamic screen space error optimization has the maximum effect."
  })
  dynamicScreenSpaceErrorHeightFalloff?: number;

  @primitiveTrait({
    type: "number",
    name: "Cache bytes",
    description:
      "The size (in bytes) to which the tile cache will be trimmed if not needed for the current view. This is the modern replacement for the now-removed `maximumNumberOfLoadedTiles` option."
  })
  cacheBytes?: number;

  @primitiveTrait({
    type: "number",
    name: "Maximum cache overflow bytes",
    description:
      "The maximum additional memory (in bytes) to allow for cache headroom, if more than `cacheBytes` are needed for the current view."
  })
  maximumCacheOverflowBytes?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Skip level of detail",
    description:
      "Optimization option. Determines if level of detail skipping should be applied during the tileset traversal, allowing the renderer to skip levels of the tree rather than always refining one level at a time. Not tied to the quality slider - this is a traversal-algorithm choice, not a fidelity trade-off, so enabling it should generally help regardless of the current quality tier."
  })
  skipLevelOfDetail?: boolean;

  @primitiveTrait({
    type: "number",
    name: "Base screen space error",
    description:
      "The screen space error that must be reached before skipping levels of detail. Only used when `skipLevelOfDetail` is true."
  })
  baseScreenSpaceError?: number;

  @primitiveTrait({
    type: "number",
    name: "Skip screen space error factor",
    description:
      "Defines how much must the screen space error be improved before a tile is no longer skipped in the level-of-detail traversal. Only used when `skipLevelOfDetail` is true."
  })
  skipScreenSpaceErrorFactor?: number;

  @primitiveTrait({
    type: "number",
    name: "Skip levels",
    description:
      "The minimum number of levels to skip when loading tiles during the level-of-detail traversal. Only used when `skipLevelOfDetail` is true."
  })
  skipLevels?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Immediately load desired level of detail",
    description:
      "Determines whether the tileset should load the desired level of detail immediately, bypassing the level-of-detail skipping optimization entirely, trading more upfront bandwidth for reaching full detail faster. Only used when `skipLevelOfDetail` is true."
  })
  immediatelyLoadDesiredLevelOfDetail?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Load siblings",
    description:
      "Determines whether siblings of visible tiles are always downloaded during traversal, so panning to reveal them doesn't need a fresh request. Only has an effect when `skipLevelOfDetail` is true - setting it on a dataset that doesn't also enable `skipLevelOfDetail` will silently do nothing."
  })
  loadSiblings?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Cull requests while moving",
    description:
      "Optimization option. Don't request tiles that will likely be unused when they come back because the camera is moving. Already defaults to true in Cesium; expose here for the rare dataset that needs different behaviour."
  })
  cullRequestsWhileMoving?: boolean;

  @primitiveTrait({
    type: "number",
    name: "Cull requests while moving multiplier",
    description:
      "Optimization option. Multiplier used in culling requests while moving. Larger is more aggressive culling, smaller less aggressive culling."
  })
  cullRequestsWhileMovingMultiplier?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Preload when hidden",
    description:
      "Preload tiles when tileset.show is false. Loads tiles as if the tileset is visible but does not render them."
  })
  preloadWhenHidden?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Cull with children bounds",
    description:
      "Optimization option. Whether to cull tiles using the union of their children bounding volumes. Note: this is only read once, when the tileset is first created - it cannot be changed on an already-loaded tileset without reloading it."
  })
  cullWithChildrenBounds?: boolean;
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
  SplitterTraits,
  LayerOrderingTraits,
  CesiumIonTraits
) {
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

  @primitiveArrayTrait({
    name: "lightColor",
    type: "number",
    description:
      "The light color when shading models. When undefined the scene's light color is used instead. eg: [255, 255, 255]."
  })
  lightColor?: number[];

  @primitiveTrait({
    name: "Drape imagery",
    type: "boolean",
    description:
      "When true allows draping imagery on top of this tileset. Imagery items appearing above this catalog item in the workbench will be draped on top of the tileset."
  })
  drapeImagery?: boolean = false;
}
