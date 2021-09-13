import CatalogMemberTraits from "./CatalogMemberTraits";
import DimensionTraits from "./DimensionTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import SdmxCommonTraits from "./SdmxCommonTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";

export class SdmxDimensionTraits extends mixTraits(DimensionTraits) {
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
  MappableTraits,
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

  @primitiveTrait({
    type: "string",
    name: "Unit Measure",
    description:
      "This string is essentially 'units' for the dataset. If a UNIT_MEASURE SDMX attribute exists in this dataflow, the default `unitMeasure` will be determined from it."
  })
  unitMeasure?: string;

  @objectArrayTrait({
    type: SdmxDimensionTraits,
    name: "Dimensions",
    description: "Dimensions",
    idProperty: "id"
  })
  dimensions?: SdmxDimensionTraits[];
}
