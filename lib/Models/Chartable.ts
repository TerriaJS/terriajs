import ChartData from "../Charts/ChartData";
import ModelTraits from "../Traits/ModelTraits";
import Model, { BaseModel } from "./Model";

interface Chartable extends Model<ModelTraits> {
  readonly chartItems: ReadonlyArray<ChartData>;
  loadChartItems(): Promise<void>;
}

namespace Chartable {
  export function is(model: BaseModel | Chartable): model is Chartable {
    return "chartItems" in model;
  }
}

export default Chartable;
