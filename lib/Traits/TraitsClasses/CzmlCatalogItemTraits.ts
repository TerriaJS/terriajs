import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class CzmlCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  DiscretelyTimeVaryingTraits,
  FeatureInfoTraits,
  UrlTraits,
  CatalogMemberTraits,
  MappableTraits
) {
  @anyTrait({
    name: "CZML Data",
    description: "A CZML data array."
  })
  czmlData?: JsonObject[];

  @primitiveTrait({
    type: "string",
    name: "CZML String",
    description: "A CZML string."
  })
  czmlString?: string;
}
