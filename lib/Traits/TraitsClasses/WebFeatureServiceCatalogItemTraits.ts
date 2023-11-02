import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import StyleTraits from "./StyleTraits";

export default class WebFeatureServiceCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  GetCapabilitiesTraits
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
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;
}
