import ChartData from "../Charts/ChartData";
import ModelTraits from "../Traits/ModelTraits";
import Model, { BaseModel } from "./Model";
import { ScalePropType } from "victory";

export interface ChartAxis {
  scale: ScalePropType;
  units?: string;
}

interface Chartable extends Model<ModelTraits> {
  readonly chartItems: ReadonlyArray<ChartData>;
  /* Description of the x-axis of the chartable item */
  readonly chartAxis: Readonly<ChartAxis | undefined>;
  loadChartItems(): Promise<void>;
}

namespace Chartable {
  export function is(model: BaseModel | Chartable): model is Chartable {
    return "chartItems" in model;
  }
}

export default Chartable;
