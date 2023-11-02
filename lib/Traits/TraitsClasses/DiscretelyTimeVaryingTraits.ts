import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ChartTraits from "./ChartTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";

export default class DiscretelyTimeVaryingTraits extends mixTraits(
  ChartTraits,
  TimeVaryingTraits
) {
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
