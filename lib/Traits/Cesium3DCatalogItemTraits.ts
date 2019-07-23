import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

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
}

export default class Cesium3DTilesCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits
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

  @primitiveTrait({
    type: "string",
    name: "Shadows",
    description:
      "Determines whether the tileset casts or receives shadows from each light source."
  })
  shadows = "NONE";

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
}
