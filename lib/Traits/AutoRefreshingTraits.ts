import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import MappableTraits from "./MappableTraits";

export default class AutoRefreshingTraits extends mixTraits(
  MappableTraits,
  ModelTraits
) {
  @primitiveTrait({
    name: "Refresh interval",
    description: "How often the data in this model is refreshed, in seconds",
    type: "number"
  })
  refreshInterval?: number;

  @primitiveTrait({
    name: "Refresh enabled",
    description: "Toggle for enabling auto refresh.",
    type: "boolean"
  })
  refreshEnabled: boolean = true;
}
