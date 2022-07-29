import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import { DATE_SECONDS_PRECISION } from "../ModelMixins/TimeVarying";
import DiscretelyTimeVaryingTraits from "../Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import CommonStrata from "./Definition/CommonStrata";
import CreateModel from "./Definition/CreateModel";
import Terria from "./Terria";

export default class DefaultTimelineModel extends DiscretelyTimeVaryingMixin(
  CreateModel(DiscretelyTimeVaryingTraits)
) {
  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    const now = JulianDate.now();
    this.setTrait(
      CommonStrata.defaults,
      "startTime",
      JulianDate.toIso8601(
        JulianDate.addHours(now, -12, new JulianDate()),
        DATE_SECONDS_PRECISION
      )
    );
    this.setTrait(
      CommonStrata.defaults,
      "stopTime",
      JulianDate.toIso8601(
        JulianDate.addHours(now, 12, new JulianDate()),
        DATE_SECONDS_PRECISION
      )
    );
  }

  protected async forceLoadMapItems() {}

  get mapItems() {
    return [];
  }

  get discreteTimes() {
    return undefined;
  }
}
