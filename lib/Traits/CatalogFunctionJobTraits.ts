import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";

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
  @primitiveArrayTrait({
    name: "Logs",
    description: "Job logs.",
    type: "string"
  })
  logs: string[] = [];

  @primitiveTrait({
    name: "Job status",
    description: "Job status.",
    type: "string"
  })
  jobStatus: "inactive" | "running" | "error" | "finished" = "inactive";

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
