import { computed } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "../Map/ColorMap";
import addModelStrataView from "../Models/addModelStrataView";
import createStratumInstance from "../Models/createStratumInstance";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import Model from "../Models/Model";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../Traits/TableColorStyleTraits";
import TableScaleStyleTraits from "../Traits/TableScaleStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTraits from "../Traits/TableTraits";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import createEmptyModel from "../Models/createEmptyModel";
import ConstantColorMap from "../Map/ConstantColorMap";
import ColorPalette from "./ColorPalette";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import EnumColorMap from "../Map/EnumColorMap";
import filterOutUndefined from "../Core/filterOutUndefined";

const defaultColor = "yellow";

interface TableModel extends Model<TableTraits> {
  readonly dataColumnMajor: string[][] | undefined;
  readonly tableColumns: readonly TableColumn[];
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

  /**
   * Gets the {@link TableStyleTraits} for this style. The traits are derived
   * from the default styles plus this style layered on top of the default.
   */
  @computed
  get styleTraits(): ModelPropertiesFromTraits<TableStyleTraits> {
    if (
      this.styleNumber < 0 ||
      this.tableModel.styles === undefined ||
      this.styleNumber >= this.tableModel.styles.length
    ) {
      // Use the default style (if there is one), but "flatten" it.
      const defaultStyle =
        this.tableModel.defaultStyle || createStratumInstance(TableStyleTraits);
      const model = {
        strataTopToBottom: [defaultStyle]
      };
      return addModelStrataView(model, TableStyleTraits);
    } else if (this.tableModel.defaultStyle === undefined) {
      // No defaults, so just return the style.
      return this.tableModel.styles[this.styleNumber];
    } else {
      // Create a flattened view of this style plus the default style.
      const style = this.tableModel.styles[this.styleNumber];
      const model = {
        strataTopToBottom: [style, this.tableModel.defaultStyle]
      };
      return addModelStrataView(model, TableStyleTraits);
    }
  }

  /**
   * Gets the {@link TableColorStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no color traits are specified explicitly.
   */
  @computed
  get colorTraits(): ModelPropertiesFromTraits<TableColorStyleTraits> {
    return this.styleTraits.color || createEmptyModel(TableColorStyleTraits);
  }

  /**
   * Gets the {@link TableScaleStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no scale traits are specified explicitly.
   */
  @computed
  get scaleTraits(): FlattenedFromTraits<TableScaleStyleTraits> {
    return this.styleTraits.scale || createEmptyModel(TableScaleStyleTraits);
  }

  /**
   * Gets the {@link TableChartStyleTraits} from the {@link #styleTraits}.
   * Returns a default instance of no chart traits are specified explicitly.
   */
  @computed
  get chartTraits(): FlattenedFromTraits<TableChartStyleTraits> {
    return this.styleTraits.chart || createEmptyModel(TableChartStyleTraits);
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
   * Gets the chart X-axis column for this style, if any.
   */
  @computed
  get xAxisColumn(): TableColumn | undefined {
    return this.resolveColumn(this.chartTraits.xAxisColumn);
  }

  /**
   * Gets the chart Y-axis column for this style, if any.
   */
  @computed
  get yAxisColumn(): TableColumn | undefined {
    return this.resolveColumn(this.chartTraits.yAxisColumn);
  }

  /**
   * Gets the color column for this style, if any.
   */
  @computed
  get colorColumn(): TableColumn | undefined {
    return this.resolveColumn(this.colorTraits.colorColumn);
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
    readonly yAxisColumn: TableColumn;
  } {
    return this.xAxisColumn !== undefined && this.yAxisColumn !== undefined;
  }

  /**
   * Gets the number of bins (i.e. color blocks on a legend) to use in
   * coloring this data for visualization on a map. If the property returns
   * `0`, the data is colored using a continuous color map rather than
   * discrete bins.
   */
  @computed
  get numberOfColorBins(): number {
    if (this.colorColumn === undefined) {
      return 0;
    }

    // The number of bins is controlled by:
    // 1) the number of items in the `binMaximums` / `binValues` list
    //      -or, if it is undefined-
    // 2) the value of numberOfColorBins
    if (this.colorColumn.type === TableColumnType.scalar) {
      if (this.colorTraits.binMaximums !== undefined) {
        const binMaximums = this.colorTraits.binMaximums;
        const colorColumn = this.colorColumn;

        const explicitBins = binMaximums.length;
        if (
          colorColumn !== undefined &&
          colorColumn.type === TableColumnType.scalar &&
          colorColumn.valuesAsNumbers.maximum !== undefined &&
          (binMaximums.length === 0 ||
            colorColumn.valuesAsNumbers.maximum >
              binMaximums[binMaximums.length - 1])
        ) {
          // Add an extra bin to accomodate the maximum value of the dataset.
          return explicitBins + 1;
        }
        return explicitBins;
      } else {
        return this.colorTraits.numberOfBins;
      }
    } else if (this.colorColumn.type === TableColumnType.enum) {
      if (this.colorTraits.enumColors !== undefined) {
        return this.colorTraits.enumColors.length;
      } else {
        return Math.max(
          this.colorTraits.numberOfBins,
          this.colorColumn.uniqueValues.values.length
        );
      }
    }
    return 0;
  }

  @computed
  get colorPalette(): ColorPalette {
    if (this.colorTraits.colorPalette !== undefined) {
      return ColorPalette.fromString(
        this.colorTraits.colorPalette,
        this.numberOfColorBins
      );
    } else if (
      this.colorColumn === undefined ||
      this.colorColumn.type === TableColumnType.enum
    ) {
      // Enumerated values, or no color column at all, so use
      // a large, high contrast palette.
      return ColorPalette.fromString("HighContrast", this.numberOfColorBins);
    } else if (this.colorColumn.type === TableColumnType.scalar) {
      const valuesAsNumbers = this.colorColumn.valuesAsNumbers;
      if (
        valuesAsNumbers !== undefined &&
        (valuesAsNumbers.minimum || 0.0) < 0.0 &&
        (valuesAsNumbers.maximum || 0.0) > 0.0
      ) {
        // Values cross zero, so use a diverging palette
        return ColorPalette.fromString("PuOr", this.numberOfColorBins);
      }
    }

    // Use a sequential palette.
    return ColorPalette.fromString("YlOrRd", this.numberOfColorBins);
  }

  /**
   * Gets the color to use for each bin. The length of the returned array
   * will be equal to {@link #numberOfColorBins}.
   */
  @computed
  get binColors(): readonly Readonly<Color>[] {
    const numberOfBins = this.numberOfColorBins;

    // Pick a color for every bin.
    const binColors = this.colorTraits.binColors || [];
    const result: Color[] = [];
    for (let i = 0; i < numberOfBins; ++i) {
      if (i < binColors.length) {
        result.push(Color.fromCssColorString(binColors[i]));
      } else {
        result.push(this.colorPalette.selectColor(i));
      }
    }
    return result;
  }

  @computed
  get enumColors(): readonly ModelPropertiesFromTraits<EnumColorTraits>[] {
    if (this.colorTraits.enumColors !== undefined) {
      return this.colorTraits.enumColors;
    }

    const colorColumn = this.colorColumn;
    if (colorColumn === undefined) {
      return [];
    }

    // Create a color for each unique value
    const uniqueValues = colorColumn.uniqueValues.values;
    return uniqueValues.map((value, i) => {
      return {
        value: value,
        color: this.colorPalette.selectColor(i).toCssColorString()
      };
    });
  }

  /**
   * Gets an object used to map values in {@link #colorColumn} to colors
   * for this style.
   */
  @computed
  get colorMap(): ColorMap | undefined {
    const colorColumn = this.colorColumn;
    const colorTraits = this.colorTraits;

    if (colorColumn === undefined) {
      // No column to color by, so use the same color for everything.
      const color =
        colorTraits.nullColor !== undefined
          ? Color.fromCssColorString(colorTraits.nullColor)
          : this.binColors.length > 0
          ? this.binColors[0]
          : Color.fromCssColorString(defaultColor);
      return new ConstantColorMap(color);
    } else if (colorColumn.type === TableColumnType.scalar) {
      const maximums = computeMaximums(
        this.numberOfColorBins,
        this.colorTraits.binMaximums,
        colorColumn
      );

      return new DiscreteColorMap({
        bins: this.binColors.map((color, i) => {
          return {
            color: color,
            maximum: maximums[i],
            includeMinimumInThisBin: false
          };
        }),
        nullColor: colorTraits.nullColor
          ? Color.fromCssColorString(colorTraits.nullColor)
          : new Color(0.0, 0.0, 0.0, 0.0)
      });
    } else if (colorColumn.type === TableColumnType.enum) {
      return new EnumColorMap({
        enumColors: filterOutUndefined(this.enumColors.map(e => {
          if (e.value === undefined || e.color === undefined) {
            return undefined;
          }
          return {
            value: e.value,
            color: Color.fromCssColorString(e.color)
          };
        })),
        nullColor: colorTraits.nullColor
          ? Color.fromCssColorString(colorTraits.nullColor)
          : new Color(0.0, 0.0, 0.0, 0.0)
      });
    }
  }

  private resolveColumn(name: string | undefined): TableColumn | undefined {
    if (name === undefined) {
      return undefined;
    }
    return this.tableModel.tableColumns.find(column => column.name === name);
  }
}

function computeMaximums(
  numberOfBins: number,
  bins: readonly number[] | undefined,
  column: TableColumn
): number[] {
  // TODO
  const asNumbers = column.valuesAsNumbers;
  const min = asNumbers.minimum;
  const max = asNumbers.maximum;
  if (min === undefined || max === undefined) {
    return [];
  }

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
