import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ExportableTraits from "./ExportableTraits";
import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";

export class SdmxDimensionsOption extends ModelTraits {
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
export class SdmxDimension extends ModelTraits {
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
}

export default class SdmxCatalogItemTraits extends mixTraits(
  ExportableTraits,
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
}
