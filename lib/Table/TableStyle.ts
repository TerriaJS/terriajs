import groupBy from "lodash-es/groupBy";
import { computed } from "mobx";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import ConstantColorMap from "../Map/ConstantColorMap";
import ConstantPointSizeMap from "../Map/ConstantPointSizeMap";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import EnumColorMap from "../Map/EnumColorMap";
import PointSizeMap from "../Map/PointSizeMap";
import ScalePointSizeMap from "../Map/ScalePointSizeMap";
import createCombinedModel from "../Models/Definition/createCombinedModel";
import Model from "../Models/Definition/Model";
import TableChartStyleTraits from "../Traits/TraitsClasses/TableChartStyleTraits";
import TableColorStyleTraits from "../Traits/TraitsClasses/TableColorStyleTraits";
import TablePointSizeStyleTraits from "../Traits/TraitsClasses/TablePointSizeStyleTraits";
import TableStyleTraits from "../Traits/TraitsClasses/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TraitsClasses/TableTimeStyleTraits";
import TableTraits from "../Traits/TraitsClasses/TableTraits";
import TableColorMap from "./TableColorMap";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";

const DEFAULT_FINAL_DURATION_SECONDS = 3600 * 24 - 1; // one day less a second, if there is only one date.

interface TableModel extends Model<TableTraits> {
  readonly dataColumnMajor: string[][] | undefined;
  readonly tableColumns: readonly TableColumn[];
  readonly rowIds: number[];
}

/**
 * A style controlling how tabular data is displayed.
 */
export default class TableStyle {
  readonly styleNumber: number;
  readonly tableModel: TableModel;

  constructor(tableModel: TableModel, styleNumber: number) {
    this.styleNumber = styleNumber;
    this.tableModel = tableModel;
  }

  /**
   * Gets the ID of the style.
   */
  @computed
  get id(): string {
    return this.styleTraits.id || "Style" + this.styleNumber;
  }

  @computed
  get title(): string {
    return (
      this.styleTraits.title ??
      this.tableModel.tableColumns.find(col => col.name === this.id)?.title ??
      this.id
    );
  }

  /** Hide style from "Display Variable" selector if number of colors (EnumColorMap or DiscreteColorMapw) is less than 2. As a ColorMap with a single color isn't super useful. */
  @computed
  get hidden() {
    if (isDefined(this.styleTraits.hidden)) return this.styleTraits.hidden;

    if (this.colorMap instanceof ConstantColorMap) return true;

    if (
      (this.colorMap instanceof EnumColorMap ||
        this.colorMap instanceof DiscreteColorMap) &&
      this.colorMap.colors.length < 2
    )
      return true;
  }

  /**
   * Gets the {@link TableStyleTraits} for this style. The traits are derived
   * from the default styles plus this style layered on top of the default.
   */
  @computed
  get styleTraits(): Model<TableStyleTraits> {
    if (
      this.styleNumber >= 0 &&
      this.styleNumber < this.tableModel.styles.length
    ) {
      const result = createCombinedModel(
        this.tableModel.styles[this.styleNumber],
        this.tableModel.defaultStyle
      );
      return result;
    } else {
      return this.tableModel.defaultStyle;
    }
  }

  /**
   * Gets the {@link TableColorStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no color traits are specified explicitly.
   */
  @computed
  get colorTraits(): Model<TableColorStyleTraits> {
    return this.styleTraits.color;
  }

  /**
   * Gets the {@link TableScaleStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no scale traits are specified explicitly.
   */
  @computed
  get pointSizeTraits(): Model<TablePointSizeStyleTraits> {
    return this.styleTraits.pointSize;
  }

  /**
   * Gets the {@link TableChartStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no chart traits are specified explicitly.
   */
  @computed
  get chartTraits(): Model<TableChartStyleTraits> {
    return this.styleTraits.chart;
  }

  /**
   * Gets the {@link TableTimeStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance if no time traits are specified explicitly.
   */
  @computed
  get timeTraits(): Model<TableTimeStyleTraits> {
    return this.styleTraits.time;
  }

  /**
   * Gets the longitude column for this style, if any.
   */
  @computed
  get longitudeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.longitudeColumn);
  }

  /**
   * Gets the latitude column for this style, if any.
   */
  @computed
  get latitudeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.latitudeColumn);
  }

  /**
   * Gets the region column for this style, if any.
   */
  @computed
  get regionColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.regionColumn);
  }

  /**
   * Gets the columns that together constitute the id, eg: ["lat", "lon"] for
   * fixed features or ["id"].
   */
  @computed
  get idColumns(): TableColumn[] | undefined {
    const idColumns = filterOutUndefined(
      this.timeTraits.idColumns
        ? this.timeTraits.idColumns.map(name => this.resolveColumn(name))
        : []
    );
    return idColumns.length > 0 ? idColumns : undefined;
  }

  /**
   * Gets the time column for this style, if any.
   */
  @computed
  get timeColumn(): TableColumn | undefined {
    return this.timeTraits.timeColumn === null
      ? undefined
      : this.resolveColumn(this.timeTraits.timeColumn);
  }

  /**
   * Gets the end time column for this style, if any.
   */
  @computed
  get endTimeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.timeTraits.endTimeColumn);
  }

  /**
   * Gets the chart X-axis column for this style, if any.
   */
  @computed
  get xAxisColumn(): TableColumn | undefined {
    return this.resolveColumn(this.chartTraits.xAxisColumn);
  }

  /**
   * Gets the color column for this style, if any.
   */
  @computed
  get colorColumn(): TableColumn | undefined {
    return this.resolveColumn(this.colorTraits.colorColumn);
  }

  /**
   * Gets the scale column for this style, if any.
   */
  @computed
  get pointSizeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.pointSizeTraits.pointSizeColumn);
  }

  /**
   * Determines if this style is visualized as points on a map.
   */
  isPoints(): this is {
    readonly longitudeColumn: TableColumn;
    readonly latitudeColumn: TableColumn;
  } {
    return (
      this.longitudeColumn !== undefined && this.latitudeColumn !== undefined
    );
  }

  /**
   * Determines if this style is visualized as time varying points tracked by id
   */
  isTimeVaryingPointsWithId(): this is {
    readonly longitudeColumn: TableColumn;
    readonly latitudeColumn: TableColumn;
    readonly idColumns: TableColumn[];
    readonly timeColumn: TableColumn;
    readonly timeIntervals: (JulianDate | null)[];
  } {
    return (
      this.longitudeColumn !== undefined &&
      this.latitudeColumn !== undefined &&
      this.idColumns !== undefined &&
      this.timeColumn !== undefined &&
      this.timeIntervals !== undefined &&
      this.moreThanOneTimeInterval
    );
  }

  /**
   * Determines if this style is visualized as regions on a map.
   */
  isRegions(): this is { readonly regionColumn: TableColumn } {
    return this.regionColumn !== undefined;
  }

  /**
   * Determines if this style is visualized on a chart.
   */
  isChart(): this is {
    readonly xAxisColumn: TableColumn;
  } {
    return this.xAxisColumn !== undefined && this.chartTraits.lines.length > 0;
  }

  /** Style isSampled by default. TimeTraits.isSampled will be used if defined. If not, and color column is binary - isSampled will be false. */
  @computed get isSampled() {
    if (isDefined(this.timeTraits.isSampled)) return this.timeTraits.isSampled;
    if (isDefined(this.colorColumn) && this.colorColumn.isScalarBinary)
      return false;
    return true;
  }

  @computed get tableColorMap() {
    return new TableColorMap(
      this.tableModel.name ?? this.tableModel.uniqueId,
      this.colorColumn,
      this.colorTraits
    );
  }

  @computed get colorMap() {
    return this.tableColorMap.colorMap;
  }

  @computed
  get pointSizeMap(): PointSizeMap {
    const pointSizeColumn = this.pointSizeColumn;
    const pointSizeTraits = this.pointSizeTraits;

    if (pointSizeColumn && pointSizeColumn.type === TableColumnType.scalar) {
      const maximum = pointSizeColumn.valuesAsNumbers.maximum;
      const minimum = pointSizeColumn.valuesAsNumbers.minimum;

      if (isDefined(maximum) && isDefined(minimum) && maximum !== minimum) {
        return new ScalePointSizeMap(
          minimum,
          maximum,
          pointSizeTraits.nullSize,
          pointSizeTraits.sizeFactor,
          pointSizeTraits.sizeOffset
        );
      }
    }

    // can't scale point size by values in this column, so use same point size for every value
    return new ConstantPointSizeMap(pointSizeTraits.sizeOffset);
  }

  /**
   * Returns a `TimeInterval` for each row in the table.
   */
  @computed
  get timeIntervals(): (TimeInterval | null)[] | undefined {
    const timeColumn = this.timeColumn;

    if (timeColumn === undefined) {
      return;
    }

    const lastDate = timeColumn.valuesAsJulianDates.maximum;
    const intervals = timeColumn.valuesAsJulianDates.values.map((date, i) => {
      if (!date) {
        return null;
      }

      const startDate = this.startJulianDates?.[i] ?? date;
      const finishDate = this.finishJulianDates?.[i] ?? undefined;

      return new TimeInterval({
        start: startDate,
        stop: finishDate,
        isStopIncluded: JulianDate.equals(finishDate, lastDate),
        data: date
      });
    });
    return intervals;
  }

  /** Is there more than one unique time interval */
  @computed get moreThanOneTimeInterval() {
    if (this.timeIntervals) {
      // Find first non-null time interval
      const firstInterval = this.timeIntervals?.find(t => t) as
        | TimeInterval
        | undefined;
      if (firstInterval) {
        // Does there exist an interval which is different from firstInterval (that is to say, does there exist at least two unique intervals)
        return !!this.timeIntervals?.find(
          t =>
            t &&
            (!firstInterval.start.equals(t.start) ||
              !firstInterval.stop.equals(t.stop))
        );
      }
    }
    return false;
  }

  /**
   * Returns a start date for each row in the table.
   * If `timeTraits.spreadStartTime` is true - the start dates will be the earliest value for all features (eg sensor IDs) - even if the time value is **after** the earliest time step. This means that at time step 0, all features will be displayed.
   */
  @computed
  private get startJulianDates(): (JulianDate | null)[] | undefined {
    const timeColumn = this.timeColumn;
    if (timeColumn === undefined) {
      return;
    }

    const firstDate = timeColumn.valuesAsJulianDates.minimum;

    if (!this.timeTraits.spreadStartTime || !firstDate)
      return timeColumn.valuesAsJulianDates.values;

    const startDates = timeColumn.valuesAsJulianDates.values.slice();

    this.rowGroups.forEach(([groupId, rowIds]) => {
      // Find row ID with earliest date in this rowGroup
      const firstRowId = rowIds
        .filter(id => startDates[id])
        .sort((idA, idB) =>
          JulianDate.compare(startDates[idA]!, startDates[idB]!)
        )[0];
      // Set it to earliest date in the entire column
      if (isDefined(firstRowId)) startDates[firstRowId] = firstDate;
    });

    return startDates;
  }

  /**
   * Returns a finish date for each row in the table.
   */
  @computed
  private get finishJulianDates(): (JulianDate | null)[] | undefined {
    if (this.endTimeColumn) {
      return this.endTimeColumn.valuesAsJulianDates.values;
    }

    const timeColumn = this.timeColumn;
    if (timeColumn === undefined) {
      return;
    }

    const startDates = timeColumn.valuesAsJulianDates.values;

    // If displayDuration trait is set, use that to set finish date
    if (this.timeTraits.displayDuration !== undefined) {
      return startDates.map(date =>
        date
          ? JulianDate.addMinutes(
              date,
              this.timeTraits.displayDuration!,
              new JulianDate()
            )
          : null
      );
    }

    const finishDates: (JulianDate | null)[] = [];

    // Otherwise estimate a final duration value to calculate the end date for groups
    // that have only one row. Fallback to a global default if an estimate
    // cannot be found.
    for (let i = 0; i < this.rowGroups.length; i++) {
      const rowIds = this.rowGroups[i][1];
      const sortedStartDates = sortedUniqueDates(
        rowIds.map(id => timeColumn.valuesAsJulianDates.values[id])
      );
      const finalDuration =
        estimateFinalDurationSeconds(sortedStartDates) ??
        DEFAULT_FINAL_DURATION_SECONDS;

      const startDatesForGroup = rowIds.map(id => startDates[id]);
      const finishDatesForGroup = this.calculateFinishDatesFromStartDates(
        startDatesForGroup,
        finalDuration
      );
      finishDatesForGroup.forEach((date, i) => {
        finishDates[rowIds[i]] = date;
      });
    }

    return finishDates;
  }

  /** Get rows grouped by id. Id will be calculated using idColumns or latitude/longitude columns
   */
  @computed get rowGroups() {
    const groupByCols =
      this.idColumns ||
      filterOutUndefined([this.latitudeColumn, this.longitudeColumn]);
    const tableRowIds = this.tableModel.rowIds;
    return Object.entries(
      groupBy(tableRowIds, rowId =>
        groupByCols.map(col => col.values[rowId]).join("-")
      )
    );
  }

  /**
   * Computes an and end date for each given start date. The end date for a
   * given start date is the next higher date in the input. To compute the end
   * date for the last date in the input, we estimate a duration based on the
   * average interval between dates in the input. If the input has only one
   * date, then an estimate cannot be made, in that case we use the
   * `defaultFinalDurationSeconds` to compute the end date.
   */
  private calculateFinishDatesFromStartDates(
    startDates: (JulianDate | null | undefined)[],
    defaultFinalDurationSeconds: number
  ) {
    const sortedStartDates: JulianDate[] = sortedUniqueDates(startDates);
    const lastDate = this.timeColumn?.valuesAsJulianDates.maximum;

    return startDates.map(date => {
      if (!date) {
        return null;
      }

      const nextDateIndex = binarySearch(
        sortedStartDates,
        date,
        (d1: JulianDate, d2: JulianDate) => JulianDate.compare(d1, d2)
      );
      const nextDate = sortedStartDates[nextDateIndex + 1];
      if (nextDate) {
        return nextDate;
      } else if (this.timeTraits.spreadFinishTime && lastDate) {
        return lastDate;
      } else {
        // This is the last date in the row, so calculate a final date
        const finalDurationSeconds =
          estimateFinalDurationSeconds(sortedStartDates) ||
          defaultFinalDurationSeconds;
        const finalDate = addSecondsToDate(
          sortedStartDates[sortedStartDates.length - 1],
          finalDurationSeconds
        );
        return finalDate;
      }
    });
  }

  private resolveColumn(name: string | undefined): TableColumn | undefined {
    if (name === undefined) {
      return undefined;
    }
    return this.tableModel.tableColumns.find(column => column.name === name);
  }
}

/**
 * Returns an array of sorted unique dates
 */
function sortedUniqueDates(
  dates: Readonly<(JulianDate | null | undefined)[]>
): JulianDate[] {
  const nonNullDates: JulianDate[] = dates.filter((d): d is JulianDate => !!d);
  return nonNullDates
    .sort((a, b) => JulianDate.compare(a, b))
    .filter((d, i, ds) => i === 0 || !JulianDate.equals(d, ds[i - 1]));
}

function addSecondsToDate(date: JulianDate, seconds: number) {
  return JulianDate.addSeconds(date, seconds, new JulianDate());
}

function estimateFinalDurationSeconds(
  sortedDates: JulianDate[]
): number | undefined {
  const n = sortedDates.length;
  if (n > 1) {
    const finalDurationSeconds =
      JulianDate.secondsDifference(sortedDates[n - 1], sortedDates[0]) /
      (n - 1);
    return finalDurationSeconds;
  }
}
