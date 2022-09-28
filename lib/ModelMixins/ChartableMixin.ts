import { maxBy, minBy } from "lodash-es";
import Constructor from "../Core/Constructor";
import LatLonHeight from "../Core/LatLonHeight";
import Model from "../Models/Definition/Model";
import { GlyphStyle } from "../ReactViews/Custom/Chart/Glyphs";
import ModelTraits from "../Traits/ModelTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import MappableMixin from "./MappableMixin";

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
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
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
  glyphStyle?: GlyphStyle;
}

function ChartableMixin<T extends Constructor<Model<MappableTraits>>>(Base: T) {
  abstract class ChartableMixin extends MappableMixin(Base) {
    get isChartable() {
      return true;
    }

    /**
     * Gets the items to show on a chart.
     */
    abstract get chartItems(): ChartItem[];
  }

  return ChartableMixin;
}

namespace ChartableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ChartableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.isChartable;
  }
}

export default ChartableMixin;
