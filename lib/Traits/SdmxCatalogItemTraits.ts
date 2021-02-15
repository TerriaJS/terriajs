import CatalogMemberTraits from "./CatalogMemberTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";
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

  @primitiveTrait({
    type: "string",
    name: "View mode",
    description:
      "Data view mode: `region` will show region-mapped data for a single time value or `time` will show time-series for a specific region"
  })
  viewBy?: "region" | "time" | undefined;

  @primitiveTrait({
    type: "string",
    name: "Primary measure dimension ID",
    description:
      "ID of primary measure dimension. This is used to find the actual values!"
  })
  primaryMeasureDimensionId?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Time measure dimenion ID",
    description:
      "ID of time dimenions. This is used to find show values by time-series or to filter a specific time-slice."
  })
  timeDimensionIds?: string[];

  @primitiveArrayTrait({
    type: "string",
    name: "Region mapped dimension IDs",
    description:
      "Dimension IDs which are treated as region-mapped columns or to filter by a specific region"
  })
  regionMappedDimensionIds?: string[];
}
