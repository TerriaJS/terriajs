import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import EnumDimensionTraits from "./DimensionTraits";
import LegendOwnerTraits from "./FeatureInfoTraits";
import SdmxCommonTraits from "./SdmxCommonTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

export class SdmxDimensionTraits extends mixTraits(EnumDimensionTraits) {
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
  TableTraits,
  LegendOwnerTraits
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
