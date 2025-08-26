import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import ChartTraits from "./ChartTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";

export class DiscreteTimesTraits extends ModelTraits {
  @primitiveArrayTrait({
    name: "Times",
    type: "string",
    description: "The discrete times expressed as ISO8601 strings."
  })
  times: string[] = [];

  @primitiveArrayTrait({
    name: "Normal Cartesian3",
    type: "string",
    description:
      "The discrete time tags, these are optional (this array can be empty, or it can be expressed as empty strings). This can be used to store model specific information about the discrete times (eg )."
  })
  tags: string[] = [];
}

export default class DiscretelyTimeVaryingTraits extends mixTraits(
  ChartTraits,
  TimeVaryingTraits
) {
  @objectTrait({
    type: DiscreteTimesTraits,
    name: "Discrete Times",
    description:
      "The discrete times for this dataset. Note, for performance reasons, this is split into two arrays of strings: `times` and `tags`."
  })
  discreteTimes?: DiscreteTimesTraits;

  @primitiveTrait({
    name: "Mapping from Continuous Time",
    description:
      "Specifies how a continuous time (e.g. the timeline control) is mapped to a discrete time for this dataset. Valid values are: <br/>" +
      " * `nearest` - the nearest available discrete time to the current continuous time is used. <br/>" +
      " * `next` - the discrete time equal to or after the current continuous time is used. <br/>" +
      " * `previous` - the discrete time equal to or before the current continuous time is used.",
    type: "string"
  })
  fromContinuous: string = "nearest";

  @primitiveTrait({
    type: "boolean",
    name: "Show in chart",
    description: "Whether to plot data availability on a chart."
  })
  showInChartPanel = false;

  @primitiveTrait({
    type: "boolean",
    name: "Disable date time selector",
    description: "When true, disables the date time selector in the workbench"
  })
  disableDateTimeSelector = false;

  @primitiveTrait({
    name: "Time Multiplier",
    description:
      "The multiplierDefaultDeltaStep is used to set the default multiplier (see `TimeVaryingTraits.multiplier` trait) - it represents the average number of (real-time) seconds between (dataset) time steps. For example, a value of five would set the `multiplier` so that a new time step (of this dataset) would appear every five seconds (on average) if the timeline is playing. This trait will only take effect if `multiplier` is **not** explicitly set.",
    type: "number"
  })
  multiplierDefaultDeltaStep?: number = 2;
}
