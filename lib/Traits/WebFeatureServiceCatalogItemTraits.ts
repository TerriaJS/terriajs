import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import SplitterTraits from "./SplitterTraits";
import UrlTraits from "./UrlTraits";
import objectTrait from "./objectTrait";
import { StyleTraits } from "./GeoJsonCatalogItemTraits";

export default class WebFeatureServiceCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  LayerOrderingTraits,
  SplitterTraits,
  GetCapabilitiesTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Type Name(s)",
    description: "The type name or names to display."
  })
  typeNames?: string;

  @primitiveTrait({
    type: "number",
    name: "Max features",
    description: "Maximum number of features to display."
  })
  maxFeatures = 1000;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the WFS Server when requesting features."
  })
  parameters?: JsonObject;

  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description: "Styling rules that follow simplestyle-spec"
  })
  style?: StyleTraits;
}
