import CatalogMemberTraits from "./CatalogMemberTraits";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";

export class FunctionParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "id",
    description: "Id."
  })
  "id"?: string;
  @primitiveTrait({
    type: "string",
    name: "id",
    description: "Id."
  })
  "value"?: string;
}

export default class CatalogFunctionJobTraits extends mixTraits(
  CatalogFunctionTraits,
  AutoRefreshingTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Job status",
    description: "Job status.",
    type: "string"
  })
  jobStatus: "inactive" | "running" | "finished" = "inactive";

  @primitiveTrait({
    name: "Refresh enabled",
    description:
      "Toggle for enabling auto refresh. (This overrides Trait in AutoRefreshingTraits)",
    type: "boolean"
  })
  refreshEnabled: boolean = false;

  @primitiveTrait({
    name: "Refresh interval",
    description:
      "How often the data in this model is refreshed, in seconds. (This overrides Trait in AutoRefreshingTraits)",
    type: "number"
  })
  refreshInterval = 1;
}
