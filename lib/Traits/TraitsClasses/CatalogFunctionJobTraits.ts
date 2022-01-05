import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class CatalogFunctionJobTraits extends mixTraits(
  CatalogFunctionTraits,
  AutoRefreshingTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  GroupTraits
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
    name: "Downloaded results",
    description: "Downloaded results.",
    type: "boolean"
  })
  downloadedResults: boolean = false;

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
      "How often the job will poll for results, in seconds. (This overrides `AutoRefreshingTraits`)",
    type: "number"
  })
  refreshInterval = 1;
}
