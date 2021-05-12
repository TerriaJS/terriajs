import groupBy from "lodash-es/groupBy";
import { computed } from "mobx";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import Color from "terriajs-cesium/Source/Core/Color";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import createColorForIdTransformer from "../Core/createColorForIdTransformer";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import ColorMap from "../Map/ColorMap";
import ConstantColorMap from "../Map/ConstantColorMap";
import ConstantPointSizeMap from "../Map/ConstantPointSizeMap";
import ContinuousColorMap from "../Map/ContinuousColorMap";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import EnumColorMap from "../Map/EnumColorMap";
import PointSizeMap from "../Map/PointSizeMap";
import ScalePointSizeMap from "../Map/ScalePointSizeMap";
import createCombinedModel from "../Models/createCombinedModel";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../Traits/TableColorStyleTraits";
import TablePointSizeStyleTraits from "../Traits/TablePointSizeStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TableTimeStyleTraits";
import TableTraits from "../Traits/TableTraits";
import ColorPalette from "./ColorPalette";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";

const getColorForId = createColorForIdTransformer();
const defaultColor = "yellow";
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
      this.timeIntervals !== undefined
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

  @computed
  get paletteName() {
    const colorColumn = this.colorColumn;

    if (colorColumn === undefined) {
      return;
    }

    let paletteName = this.colorTraits.colorPalette;

    if (
      colorColumn.type === TableColumnType.enum ||
      colorColumn.type === TableColumnType.region ||
      colorColumn.type === TableColumnType.text
    ) {
      // Enumerated values, so use a large, high contrast palette.
      paletteName = paletteName || "HighContrast";
    } else if (colorColumn.type === TableColumnType.scalar) {
      if (paletteName === undefined) {
        const valuesAsNumbers = colorColumn.valuesAsNumbers;
        if (
          valuesAsNumbers !== undefined &&
          (valuesAsNumbers.minimum || 0.0) < 0.0 &&
          (valuesAsNumbers.maximum || 0.0) > 0.0
        ) {
          // Values cross zero, so use a diverging palette
          paletteName = "PuOr";
        } else {
          // Values do not cross zero so use a sequential palette.
          paletteName = "Viridis";
        }
      }
    }

    return paletteName;
  }

  @computed
  get colorPalette(): ColorPalette {
    const numberOfBins = this.numberOfBins;

    if (
      this.paletteName !== undefined &&
      numberOfBins !== undefined &&
      numberOfBins !== 0
    ) {
      return ColorPalette.fromString(this.paletteName, numberOfBins);
    } else {
      return new ColorPalette([]);
    }
  }

  @computed
  get numberOfBins(): number {
    const colorColumn = this.colorColumn;
    if (colorColumn === undefined) return this.binMaximums.length;
    if (
      colorColumn.type === TableColumnType.enum ||
      colorColumn.type === TableColumnType.region ||
      colorColumn.type === TableColumnType.text
    ) {
      return colorColumn.uniqueValues.values.length;
    } else if (colorColumn.type === TableColumnType.scalar) {
      return colorColumn.uniqueValues.values.length < this.binMaximums.length
        ? colorColumn.uniqueValues.values.length
        : this.binMaximums.length;
    }
    return this.binMaximums.length;
  }

  /**
   * Gets the color to use for each bin. The length of the returned array
   * will be equal to {@link #numberOfColorBins}.
   */
  @computed
  get binColors(): readonly Readonly<Color>[] {
    const numberOfBins = this.numberOfBins;

    // Pick a color for every bin.
    const binColors = this.colorTraits.binColors || [];
    const result: Color[] = [];
    for (let i = 0; i < numberOfBins; ++i) {
      if (i < binColors.length) {
        result.push(
          Color.fromCssColorString(binColors[i]) ?? Color.TRANSPARENT
        );
      } else {
        result.push(this.colorPalette.selectColor(i));
      }
    }
    return result;
  }

  @computed
  get binMaximums(): readonly number[] {
    const colorColumn = this.colorColumn;
    if (colorColumn === undefined) {
      return this.colorTraits.binMaximums || [];
    }

    const binMaximums = this.colorTraits.binMaximums;
    if (binMaximums !== undefined) {
      if (
        colorColumn.type === TableColumnType.scalar &&
        colorColumn.valuesAsNumbers.maximum !== undefined &&
        (binMaximums.length === 0 ||
          colorColumn.valuesAsNumbers.maximum >
            binMaximums[binMaximums.length - 1])
      ) {
        // Add an extra bin to accomodate the maximum value of the dataset.
        return binMaximums.concat([colorColumn.valuesAsNumbers.maximum]);
      }
      return binMaximums;
    } else if (this.colorTraits.numberOfBins === 0) {
      return [];
    } else {
      // TODO: compute maximums according to ckmeans, quantile, etc.
      const asNumbers = colorColumn.valuesAsNumbers;
      const min = asNumbers.minimum;
      const max = asNumbers.maximum;
      if (min === undefined || max === undefined) {
        return [];
      }
      const numberOfBins =
        colorColumn.uniqueValues.values.length < this.colorTraits.numberOfBins
          ? colorColumn.uniqueValues.values.length
          : this.colorTraits.numberOfBins;
      let next = min;
      const step = (max - min) / numberOfBins;

      const result: number[] = [];
      for (let i = 0; i < numberOfBins - 1; ++i) {
        next += step;
        result.push(next);
      }

      result.push(max);

      return result;
    }
  }

  @computed
  get enumColors(): readonly ModelPropertiesFromTraits<EnumColorTraits>[] {
    if (this.colorTraits.enumColors.length > 0) {
      return this.colorTraits.enumColors;
    }

    const colorColumn = this.colorColumn;
    if (colorColumn === undefined) {
      return [];
    }

    // Create a color for each unique value
    const uniqueValues = colorColumn.uniqueValues.values;
    const palette = this.colorPalette;
    return uniqueValues.map((value, i) => {
      return {
        value: value,
        color: palette.selectColor(i).toCssColorString()
      };
    });
  }

  /**
   * Gets an object used to map values in {@link #colorColumn} to colors
   * for this style.
   */
  @computed
  get colorMap(): ColorMap {
    const colorColumn = this.colorColumn;
    const colorTraits = this.colorTraits;

    const nullColor = colorTraits.nullColor
      ? Color.fromCssColorString(colorTraits.nullColor) ?? Color.TRANSPARENT
      : Color.TRANSPARENT;

    const minValue =
      colorTraits.minimumValue ?? colorColumn?.valuesAsNumbers.minimum;
    const maxValue =
      colorTraits.maximumValue ?? colorColumn?.valuesAsNumbers.maximum;

    if (colorColumn && colorColumn.type === TableColumnType.scalar) {
      if (this.binMaximums.length > 0) {
        return new DiscreteColorMap({
          bins: this.binColors.map((color, i) => {
            return {
              color: color,
              maximum: this.binMaximums[i],
              includeMinimumInThisBin: false
            };
          }),
          nullColor
        });
      } else if (
        this.paletteName &&
        isDefined(minValue) &&
        isDefined(maxValue)
      ) {
        return new ContinuousColorMap({
          palette: this.paletteName,
          minValue,
          maxValue,
          nullColor
        });
      }
    } else if (
      colorColumn &&
      (colorColumn.type === TableColumnType.enum ||
        colorColumn.type === TableColumnType.region ||
        colorColumn.type === TableColumnType.text)
    ) {
      const regionColor =
        Color.fromCssColorString(this.colorTraits.regionColor) ??
        Color.TRANSPARENT;
      return new EnumColorMap({
        enumColors: filterOutUndefined(
          this.enumColors.map(e => {
            if (e.value === undefined || e.color === undefined) {
              return undefined;
            }
            return {
              value: e.value,
              color:
                colorColumn.type !== TableColumnType.region
                  ? Color.fromCssColorString(e.color) ?? Color.TRANSPARENT
                  : regionColor
            };
          })
        ),
        nullColor
      });
    }

    // No column to color by, so use the same color for everything.
    let color = Color.fromCssColorString(defaultColor);
    const colorId = this.tableModel.uniqueId || this.tableModel.name;
    if (colorTraits.nullColor) {
      color = Color.fromCssColorString(colorTraits.nullColor);
    } else if (this.binColors.length > 0) {
      color = this.binColors[0];
    } else if (colorId) {
      color = Color.fromCssColorString(getColorForId(colorId));
    }
    return new ConstantColorMap(color, this.tableModel.name);
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
    const displayDuration = this.timeTraits.displayDuration;

    if (timeColumn === undefined) {
      return;
    }

    const getFinishDate = (startDate: JulianDate, rowIndex: number) => {
      if (displayDuration !== undefined) {
        return JulianDate.addMinutes(
          startDate,
          displayDuration,
          new JulianDate()
        );
      } else {
        return this.finishJulianDates?.[rowIndex] || undefined;
      }
    };

    const lastDate = timeColumn.valuesAsJulianDates.maximum;
    const intervals = timeColumn.valuesAsJulianDates.values.map(
      (startDate, i) => {
        if (!startDate) {
          return null;
        }

        const finishDate = getFinishDate(startDate, i);
        return new TimeInterval({
          start: startDate,
          stop: finishDate,
          isStopIncluded: JulianDate.equals(finishDate, lastDate),
          data: startDate
        });
      }
    );
    return intervals;
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

    // If id columns is not defined, group rows by (lat, lon) so that the
    // finish date for a row with a certain location will be the date for
    // the next row at the same location.
    const groupByCols =
      this.idColumns ||
      filterOutUndefined([this.latitudeColumn, this.longitudeColumn]);
    const tableRowIds = this.tableModel.rowIds;
    const rowGroups = Object.values(
      groupBy(tableRowIds, rowId =>
        groupByCols.map(col => col.values[rowId]).join("-")
      )
    );

    // Estimate a final duration value to calculate the end date for groups
    // that have only one row. Fallback to a global default if an estimate
    // cannot be found.
    let finalDurationSeconds = DEFAULT_FINAL_DURATION_SECONDS;
    for (let i = 0; i < rowGroups.length; i++) {
      const rowIds = rowGroups[i];
      const startDates = rowIds.map(
        id => timeColumn.valuesAsJulianDates.values[id]
      );
      const sortedStartDates = sortedUniqueDates(startDates);
      const finalDuration = estimateFinalDurationSeconds(sortedStartDates);
      if (finalDuration) {
        finalDurationSeconds = finalDuration;
        break;
      }
    }

    const startDates = timeColumn.valuesAsJulianDates.values;
    const finishDates: (JulianDate | null)[] = [];
    rowGroups.forEach(rowIds => {
      const startDatesForGroup = rowIds.map(id => startDates[id]);
      const finishDatesForGroup = this.calculateFinishDatesFromStartDates(
        startDatesForGroup,
        finalDurationSeconds
      );
      finishDatesForGroup.forEach((date, i) => {
        finishDates[rowIds[i]] = date;
      });
    });
    return finishDates;
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
