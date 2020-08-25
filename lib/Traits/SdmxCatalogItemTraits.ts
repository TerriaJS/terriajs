import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import TableTraits from "./TableTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import { Dimension, DimensionOption } from "../Models/SelectableDimensions";
import primitiveArrayTrait from "./primitiveArrayTrait";
import { SdmxCommonTraits } from "./SdmxCatalogGroupTraits";

export class SdmxDimensionsOption extends ModelTraits
  implements DimensionOption {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Option ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Option name (human-readable)"
  })
  name?: string;
}
export class SdmxDimension extends ModelTraits implements Dimension {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Dimension ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Dimension name (human-readable)"
  })
  name?: string;

  @objectArrayTrait({
    type: SdmxDimensionsOption,
    idProperty: "id",
    name: "Options",
    description: "Dimension options"
  })
  options?: SdmxDimensionsOption[];

  @primitiveTrait({
    type: "string",
    name: "Selected ID",
    description: "Selected Option's ID"
  })
  selectedId?: string;

  @primitiveTrait({
    type: "string",
    name: "Position",
    description:
      "The position attribute specifies the position of the dimension in the data structure definition, starting at 0. This is important for making requesting sdmx-csv"
  })
  position?: number;
}

export default class SdmxCatalogItemTraits extends mixTraits(
  DiscretelyTimeVaryingTraits,
  FeatureInfoTraits,
  TableTraits,
  SdmxCommonTraits
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
    type: SdmxDimension,
    name: "Dimensions",
    description: "Dimensions",
    idProperty: "id"
  })
  dimensions?: SdmxDimension[];

  @primitiveTrait({
    type: "string",
    name: "View mode",
    description:
      "Data view mode: `region` will show region-mapped data for a single time value or `time` will show time-series for a specific region"
  })
  viewBy?: "region" | "time" | undefined;

  @primitiveTrait({
    type: "string",
    name: "Primary measure dimenion ID",
    description:
      "ID of primary measure dimenion. This is used to find the actual values!"
  })
  primaryMeasureDimenionId?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Time measure dimenion ID",
    description:
      "ID of time dimenion. This is used to find show values by time-series or to filter a specific time-slice."
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
