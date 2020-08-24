import FeatureInfoTraits from "./FeatureInfoTraits";
import mixTraits from "./mixTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ExportableTraits from "./ExportableTraits";
import primitiveTrait from "./primitiveTrait";

export default class SdmxJsonCatalogItemTraits extends mixTraits(
  ExportableTraits,
  DiscretelyTimeVaryingTraits,
  FeatureInfoTraits,
  UrlTraits,
  TableTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Dataflow ID",
    description: "SDMX JSON Dataflow ID"
  })
  dataflowId?: string;

  @primitiveTrait({
    type: "string",
    name: "Agency ID",
    description: "SDMX JSON Agency ID"
  })
  agencyId?: string;
}
