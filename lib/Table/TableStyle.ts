import { computed } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import filterOutUndefined from "../Core/filterOutUndefined";
import ColorMap from "../Map/ColorMap";
import ConstantColorMap from "../Map/ConstantColorMap";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import EnumColorMap from "../Map/EnumColorMap";
import createCombinedModel from "../Models/createCombinedModel";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../Traits/TableColorStyleTraits";
import TablePointSizeStyleTraits from "../Traits/TablePointSizeStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTraits from "../Traits/TableTraits";
import ColorPalette from "./ColorPalette";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";

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

  @computed
  get colorPalette(): ColorPalette {
    const colorColumn = this.colorColumn;

    if (colorColumn === undefined) {
      return new ColorPalette([]);
    }

    let paletteName = this.colorTraits.colorPalette;
    let numberOfBins: number | undefined;

    if (colorColumn.type === TableColumnType.enum) {
      // Enumerated values, so use a large, high contrast palette.
      paletteName = paletteName || "HighContrast";
      numberOfBins = colorColumn.uniqueValues.values.length;
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
          paletteName = "YlOrRd";
        }
      }
      numberOfBins = this.binMaximums.length;
    }

    if (paletteName !== undefined && numberOfBins !== undefined) {
      return ColorPalette.fromString(paletteName, numberOfBins);
    } else {
      return new ColorPalette([]);
    }
  }

  /**
   * Gets the color to use for each bin. The length of the returned array
   * will be equal to {@link #numberOfColorBins}.
   */
  @computed
  get binColors(): readonly Readonly<Color>[] {
    const numberOfBins = this.binMaximums.length;

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
    } else {
      // TODO: compute maximums according to ckmeans, quantile, etc.
      const asNumbers = colorColumn.valuesAsNumbers;
      const min = asNumbers.minimum;
      const max = asNumbers.maximum;
      if (min === undefined || max === undefined) {
        return [];
      }

      const numberOfBins = this.colorTraits.numberOfBins;
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

    if (colorColumn && colorColumn.type === TableColumnType.scalar) {
      const maximums = this.binMaximums;
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
    } else if (colorColumn && colorColumn.type === TableColumnType.enum) {
      return new EnumColorMap({
        enumColors: filterOutUndefined(
          this.enumColors.map(e => {
            if (e.value === undefined || e.color === undefined) {
              return undefined;
            }
            return {
              value: e.value,
              color: Color.fromCssColorString(e.color)
            };
          })
        ),
        nullColor: colorTraits.nullColor
          ? Color.fromCssColorString(colorTraits.nullColor)
          : new Color(0.0, 0.0, 0.0, 0.0)
      });
    } else {
      // No column to color by, so use the same color for everything.
      const color =
        colorTraits.nullColor !== undefined
          ? Color.fromCssColorString(colorTraits.nullColor)
          : this.binColors.length > 0
          ? this.binColors[0]
          : Color.fromCssColorString(defaultColor);
      return new ConstantColorMap(color);
    }
  }

  private resolveColumn(name: string | undefined): TableColumn | undefined {
    if (name === undefined) {
      return undefined;
    }
    return this.tableModel.tableColumns.find(column => column.name === name);
  }
}
