import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ExportableTraits from "./ExportableTraits";
import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import { Dimension, DimensionOption } from "../Models/SelectableDimensions";
import primitiveArrayTrait from "./primitiveArrayTrait";

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
  UrlTraits,
  TableTraits
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
    name: "Primary measure concept ID",
    description: "ID of primary measure concept."
  })
  primaryMeasureConceptId?: string;

  @primitiveTrait({
    type: "string",
    name: "Primary measure dimenion ID",
    description:
      "ID of primary measure dimenion. This is used to find the actual values!"
  })
  primaryMeasureDimenionId?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Region mapped concept IDs",
    description: "Concept IDs which are treated as region-mapped columns."
  })
  regionMappedConceptIds?: string[];
}
