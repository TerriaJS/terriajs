import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import anyTrait from "./anyTrait";

export default class AutoRefreshingTraits extends ModelTraits {
  @primitiveTrait({
    name: "Refresh interval",
    description: "How often the data in this model is refreshed, in seconds",
    type: "number"
  })
  refreshInterval?: number;
}
