import ChartData from "../Charts/ChartData";
import ModelTraits from "../Traits/ModelTraits";
import Model, { BaseModel } from "./Model";
import { ScalePropType } from "victory";

export interface ChartAxis {
  scale: ScalePropType;
  units?: string;
}

export function axesMatch(a1: ChartAxis, a2: ChartAxis) {
  return a1.scale === a2.scale && a1.units === a2.units;
}

export interface ChartItem {
  name: string;
  item: Model<ModelTraits>;
  showInChartPanel: boolean;
  isSelectedInWorkbench: boolean;
  xAxis: ChartAxis;
  getColor: () => string; // Gets the color representing the chart item
  updateIsSelectedInWorkbench: (isSelected: boolean) => void; // Unselect the chart item in workbench
}

interface Chartable extends Model<ModelTraits> {
  readonly chartItems: ReadonlyArray<ChartData>;
  readonly chartItems2: ReadonlyArray<ChartItem>; // TODO: rename to chartItems2
  loadChartItems(): Promise<void>;
}

namespace Chartable {
  export function is(model: BaseModel | Chartable): model is Chartable {
    return "chartItems" in model;
  }
}

export default Chartable;
