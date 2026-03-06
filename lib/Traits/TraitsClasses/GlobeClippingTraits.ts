import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class GlobeClippingTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "globeClippingControlShowed",
    description:
      "If true, shows item control to enable automatically calculation of globe clipping planes using items data."
  })
  globeClippingControlShowed: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "globeClippingEnabled",
    description: "Enable/disable globe auto clipping planes."
  })
  globeClippingEnabled: boolean = false;
}
