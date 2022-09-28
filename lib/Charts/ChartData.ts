import { min as d3ArrayMin, max as d3ArrayMax } from "d3-array";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

export interface ChartPoint {
  readonly x: number | Date;
  readonly y: number;
}

export interface ChartDataOptions {
  /**
   * The array of points. Each point should have the format {x: X, y: Y}.
   */
  readonly points: readonly ChartPoint[];

  /**
   * Unique ID for this set of points.
   */
  readonly id?: string;

  /**
   * Name of the category for this set of points, e.g. the source catalog item.
   */
  readonly categoryName?: string;

  /**
   * Name for this set of points.
   */
  readonly name?: string;

  /**
   * Units of this set of points.
   */
  readonly units?: string;

  /**
   * A function that returns CSS color code for this set of points.
   *
   * We use a function instead of an immediate value so that colors can be
   * assigned lazily; only when it is required.
   */
  readonly getColor: () => string | undefined;

  /**
   * Minimum value for Y axis to display, overriding minimum value in data.
   */
  readonly yAxisMin?: number;

  /**
   * Maximum value for Y axis to display, overriding maximum value in data.
   */
  readonly yAxisMax?: number;

  /**
   * Chart type. If you want these points rendered with a certain way. Leave empty for auto detection.
   */
  readonly type?: string;

  /**
   * Click handler (called with (x, y) in data units) if some special behaviour is required for clicking.
   */
  readonly onClick?: (x: number, y: number) => void;

  /**
   * Request that the chart be scaled so that this series can be shown entirely.
   */
  readonly showAll?: boolean;
}

/**
 * A container to pass data to a d3 chart: a single series of data points.
 * For documentation on the custom <chart> tag, see lib/Models/registerCustomComponentTypes.js.
 *
 * @param {ChartDataOptions} [options] Further parameters.
 */
export default class ChartData {
  /**
   * The array of points. Each point should have the format {x: X, y: Y}.
   */
  readonly points: readonly ChartPoint[];

  /**
   * A selected point from the array above. Used internally by charting functions for hover/clicking functionality.
   */
  readonly point: ChartPoint | undefined;

  /**
   * Unique id for this set of points.
   */
  readonly id: string | undefined;

  /**
   * Name of the category for this set of points., eg. the source catalog item.
   */
  readonly categoryName: string | undefined;

  /**
   * Name for this set of points.
   */
  readonly name: string | undefined;

  /**
   * Units of this set of points.
   */
  readonly units: string | undefined;

  /**
   * A function that returns CSS color code for this set of points.
   *
   * We use a function instead of an immediate value so that colors can be
   * assigned lazily; only when it is required.
   */
  readonly getColor: () => string | undefined;

  /**
   * Minimum value for y axis to display, overriding minimum value in data.
   */
  readonly yAxisMin: number | undefined;

  /**
   * Maximum value for y axis to display, overriding maximum value in data.
   */
  readonly yAxisMax: number | undefined;

  /**
   * Chart type. If you want these points to be rendered with a certain way. Leave empty for auto detection.
   */
  readonly type: string | undefined;

  /**
   * Click handler (called with (x, y) in data units) if some special behaviour is required on clicking.
   */
  readonly onClick: ((x: number, y: number) => void) | undefined;

  /**
   * Request that the chart be scaled so that this series can be shown entirely.
   * @default true
   */
  readonly showAll: boolean;

  readonly yAxisWidth: number;

  constructor(options: ChartDataOptions) {
    this.points = options.points;
    this.point = undefined;
    this.id = options.id;
    this.categoryName = options.categoryName;
    this.name = options.name;
    this.units = options.units;
    this.getColor = options.getColor;
    this.yAxisMin = options.yAxisMin;
    this.yAxisMax = options.yAxisMax;
    this.type = options.type;
    this.onClick = options.onClick;
    this.showAll = defaultValue(options.showAll, true);
    this.yAxisWidth = 40;
  }

  /**
   * Calculates the min and max x and y of the points.
   * If there are no points, returns undefined.
   * @return {Object} An object {x: [xmin, xmax], y: [ymin, ymax]}.
   */
  getDomain():
    | { x: [number | Date, number | Date]; y: [number, number] }
    | undefined {
    const points = this.points;
    if (points.length === 0) {
      return undefined;
    }
    return {
      x: [
        d3ArrayMin(points, (point) => point.x)!,
        d3ArrayMax(points, (point) => point.x)!
      ],
      y: [
        d3ArrayMin(points, (point) => point.y)!,
        d3ArrayMax(points, (point) => point.y)!
      ]
    };
  }
}
