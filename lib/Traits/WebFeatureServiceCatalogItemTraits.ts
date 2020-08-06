import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import SplitterTraits from "./SplitterTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import anyTrait from "./anyTrait";
import { JsonObject } from "../Core/Json";

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
    description: "The typeName or typeNames to display."
  })
  typeNames?: string;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the MapServer when requesting images."
  })
  parameters?: JsonObject;
}
