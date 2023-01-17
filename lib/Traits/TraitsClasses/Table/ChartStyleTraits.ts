import ModelTraits from "../../ModelTraits";
import primitiveTrait from "../../Decorators/primitiveTrait";
import objectArrayTrait from "../../Decorators/objectArrayTrait";

export class TableChartLineStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Name",
    description: "Chart line name (will replace y-column name).",
    type: "string"
  })
  name?: string;

  @primitiveTrait({
    name: "Y Axis Column",
    description: "The column to use as the Y-axis.",
    type: "string"
  })
  yAxisColumn?: string;

  @primitiveTrait({
    name: "Y Axis Minimum",
    description: "The minimum value to show on the Y axis of the chart.",
    type: "number"
  })
  yAxisMinimum?: number;

  @primitiveTrait({
    name: "Y Axis Maximum",
    description: "The maximum value to show on the Y axis of the chart.",
    type: "number"
  })
  yAxisMaximum?: number;

  @primitiveTrait({
    name: "Color",
    description:
      "The color of the line. If not specified, a unique color will be assigned automatically.",
    type: "string"
  })
  color?: string;

  @primitiveTrait({
    name: "Is selected in workbench?",
    description: "The selection state of the line in the workbench.",
    type: "boolean"
  })
  isSelectedInWorkbench = true;
}

export default class TableChartStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "X Axis Column",
    description: "The column to use as the X-axis.",
    type: "string"
  })
  xAxisColumn?: string;

  @objectArrayTrait({
    name: "Lines",
    description:
      "Lines on the chart, each of which is formed by plotting a column as the Y-axis.",
    type: TableChartLineStyleTraits,
    idProperty: "yAxisColumn"
  })
  lines?: TableChartLineStyleTraits[];
}
