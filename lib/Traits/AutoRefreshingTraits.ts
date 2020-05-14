import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class AutoRefreshingTraits extends ModelTraits {
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
