import primitiveTrait from "../Decorators/primitiveTrait";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";

class AutoRefreshingTraits extends mixTraits(MappableTraits) {
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

interface AutoRefreshingTraits {
  refreshInterval?: number;
  refreshEnabled: boolean;
}

export default AutoRefreshingTraits;
