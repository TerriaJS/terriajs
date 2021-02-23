import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import SdmxCommonTraits, { DimensionTraits } from "./SdmxCommonTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";

export class SdmxDimensionTraits extends DimensionTraits {
  @primitiveTrait({
    type: "string",
    name: "Position",
    description:
      "The position attribute specifies the position of the dimension in the data structure definition, starting at 0. This is important for making sdmx-csv requests"
  })
  position?: number;
}
export default class SdmxCatalogItemTraits extends mixTraits(
  SdmxCommonTraits,

  UrlTraits,
  DiscretelyTimeVaryingTraits,
  FeatureInfoTraits,
  TableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Dataflow ID",
    description: "SDMX Dataflow ID"
  })
  dataflowId?: string;

  @primitiveTrait({
    type: "string",
    name: "Agency ID",
    description: "SDMX Agency ID"
  })
  agencyId?: string;

  @objectArrayTrait({
    type: SdmxDimensionTraits,
    name: "Dimensions",
    description: "Dimensions",
    idProperty: "id"
  })
  dimensions?: SdmxDimensionTraits[];
}
