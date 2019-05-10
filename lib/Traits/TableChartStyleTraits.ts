import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class TableChartStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "X Axis Column",
    description: "The column to use as the X-axis.",
    type: "string"
  })
  xAxisColumn?: string;

  @primitiveTrait({
    name: "Y Axis Column",
    description: "The column to use as the Y-axis.",
    type: "string"
  })
  yAxisColumn?: string;

  @primitiveTrait({
    name: "Y Axis Minimum",
    description: "The minimum value to show on the Y axis of the chart.",
    type: "string"
  })
  yAxisMinimum?: number;

  @primitiveTrait({
    name: "Y Axis Maximum",
    description: "The maximum value to show on the Y axis of the chart.",
    type: "string"
  })
  yAxisMaximum?: number;
}
