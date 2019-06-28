import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import primitiveTrait from "./primitiveTrait";
import objectTrait from "./objectTrait";
import ModelTraits from "./ModelTraits";

export class OptionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Maximum screen space error",
    description:
      "The maximum screen space error used to drive level of detail refinement."
  })
  maximumScreenSpaceError?: number;
}

export default class Cesium3DTilesCatalogItemTraits extends mixTraits(
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
  shadows?: string;

  @objectTrait({
    type: OptionsTraits,
    name: "options",
    description:
      "Additional options to pass to Cesium's Cesium3DTileset constructor."
  })
  options?: OptionsTraits;
}
