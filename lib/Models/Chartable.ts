import maxBy from "lodash-es/maxBy";
import minBy from "lodash-es/minBy";
import LatLonHeight from "../Core/LatLonHeight";
import ModelTraits from "../Traits/ModelTraits";
import Model, { BaseModel } from "./Model";

type Scale = "linear" | "time";

export interface ChartAxis {
  scale: Scale;
  units?: string;
}

export interface ChartDomain {
  x: (number | Date)[];
  y: number[];
}

export function calculateDomain(points: ChartPoint[]): ChartDomain {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const asNum = (x: Date | number) => (x instanceof Date ? x.getTime() : x);
  return {
    x: [minBy(xs, asNum) || 0, maxBy(xs, asNum) || 0],
    y: [Math.min(...ys), Math.max(...ys)]
  };
}

export function axesMatch(a1: ChartAxis, a2: ChartAxis) {
  // ignore unit label if both scales are time
  if (a1.scale === "time" && a2.scale === "time") return true;
  else return a1.scale === a2.scale && a1.units === a2.units;
}

export type ChartItemType =
  | "line"
  | "momentLines"
  | "momentPoints"
  | "lineAndPoint";

export interface ChartPoint {
  x: number | Date;
  y: number;
  isSelected?: boolean;
}

export interface ChartItem {
  name: string;
  categoryName?: string;
  key: string;
  item: Model<ModelTraits>;
  type: ChartItemType;
  showInChartPanel: boolean;
  isSelectedInWorkbench: boolean;
  xAxis: ChartAxis;
  points: ChartPoint[];
  domain: ChartDomain;
  getColor: () => string; // Gets the color representing the chart item
  updateIsSelectedInWorkbench: (isSelected: boolean) => void; // Unselect the chart item in workbench
  onClick?: any;
  pointOnMap?: LatLonHeight;
}

interface Chartable extends Model<ModelTraits> {
  readonly chartItems: ReadonlyArray<ChartItem>;
  loadChartItems(): Promise<void>;
}

namespace Chartable {
  export function is(model: BaseModel | Chartable): model is Chartable {
    return "loadChartItems" in model;
  }
}

export default Chartable;
