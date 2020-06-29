import DiscreteTimeTraits from "./DiscreteTimeTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import TimeVaryingTraits from "./TimeVaryingTraits";
import ShowableTraits from "./ShowableTraits";
import mixTraits from "./mixTraits";
import { ChartItemType } from "../Models/Chartable";

export default class DiscretelyTimeVaryingTraits extends mixTraits(
  TimeVaryingTraits,
  ShowableTraits
) {
  @primitiveTrait({
    name: "Mapping from Continuous Time",
    description:
      "Specifies how a continuous time (e.g. the timeline control) is mapped to a discrete time for this dataset. Valid values are:\n\n" +
      "  * `nearest` - the nearest available discrete time to the current continuous time is used.\n" +
      "  * `next` - the discrete time equal to or after the current continuous time is used.\n" +
      "  * `previous` - the discrete time equal to or before the current continuous time is used.",
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
    type: "string",
    name: "Chart type",
    description:
      "Type determines how the data availibility will be plotted on chart. eg: momentLines, momentPoints"
  })
  chartType: ChartItemType = "momentLines";

  @primitiveTrait({
    type: "string",
    name: "Chart Disclaimer",
    description: "A HTML string to show above the chart as a disclaimer"
  })
  chartDisclaimer?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Disable date time selector",
    description: "When true, disables the date time selector in the workbench"
  })
  disableDateTimeSelector = false;
}
