import { computed } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import ColorMap from "../Map/ColorMap";
import addModelStrataView from "../Models/addModelStrataView";
import createStratumInstance from "../Models/createStratumInstance";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import Model from "../Models/Model";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableScaleStyleTraits from "../Traits/TableScaleStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTraits from "../Traits/TableTraits";
import TableColumn from "./TableColumn";
import TableColumnType from "./TableColumnType";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import createEmptyModel from "../Models/createEmptyModel";
import ConstantColorMap from "../Map/ConstantColorMap";
import ColorPalette from "./ColorPalette";

const defaultColor = "yellow";

interface TableModel extends Model<TableTraits> {
  readonly dataColumnMajor: string[][] | undefined;
  readonly tableColumns: readonly TableColumn[];
}

export default class TableStyle {
  readonly styleNumber: number;
  readonly tableModel: TableModel;

  constructor(tableModel: TableModel, styleNumber: number) {
    this.styleNumber = styleNumber;
    this.tableModel = tableModel;
  }

  @computed
  get id(): string {
    return this.styleTraits.id || "Style" + this.styleNumber;
  }

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

  @computed
  get colorTraits(): ModelPropertiesFromTraits<TableColorStyleTraits> {
    return this.styleTraits.color || createEmptyModel(TableColorStyleTraits);
  }

  @computed
  get scaleTraits(): FlattenedFromTraits<TableScaleStyleTraits> {
    return this.styleTraits.scale || createEmptyModel(TableScaleStyleTraits);
  }

  @computed
  get chartTraits(): FlattenedFromTraits<TableChartStyleTraits> {
    return this.styleTraits.chart || createEmptyModel(TableChartStyleTraits);
  }

  @computed
  get longitudeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.longitudeColumn);
  }

  @computed
  get latitudeColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.latitudeColumn);
  }

  @computed
  get regionColumn(): TableColumn | undefined {
    return this.resolveColumn(this.styleTraits.regionColumn);
  }

  @computed
  get xAxisColumn(): TableColumn | undefined {
    return this.resolveColumn(this.chartTraits.xAxisColumn);
  }

  @computed
  get yAxisColumn(): TableColumn | undefined {
    return this.resolveColumn(this.chartTraits.yAxisColumn);
  }

  @computed
  get colorColumn(): TableColumn | undefined {
    return this.resolveColumn(this.colorTraits.colorColumn);
  }

  isPoints(): this is {
    readonly longitudeColumn: TableColumn;
    readonly latitudeColumn: TableColumn;
  } {
    return (
      this.longitudeColumn !== undefined && this.latitudeColumn !== undefined
    );
  }

  isRegions(): this is { readonly regionColumn: TableColumn } {
    return this.regionColumn !== undefined;
  }

  isChart(): this is {
    readonly xAxisColumn: TableColumn;
    readonly yAxisColumn: TableColumn;
  } {
    return this.xAxisColumn !== undefined && this.yAxisColumn !== undefined;
  }

  @computed
  get numberOfColorBins(): number {
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
    } else if (this.colorTraits.numberOfBins !== undefined) {
      return this.colorTraits.numberOfBins;
    } else {
      return 0;
    }
  }

  @computed
  get binColors(): readonly Readonly<Color>[] {
    // The number of bins is controlled by:
    // 1) the number of items in the `binMaximums` list
    //      -or, if it has none-
    // 2) the value of numberOfColorBins
    const binMaximums = this.colorTraits.binMaximums;
    let numberOfBins =
      binMaximums !== undefined && binMaximums.length > 0
        ? binMaximums.length
        : this.numberOfColorBins;

    // Pick a color for every bin.
    const binColors = this.colorTraits.binColors || [];
    const result: Color[] = [];
    let palette: ColorPalette | undefined;
    for (let i = 0; i < numberOfBins; ++i) {
      if (i < binColors.length) {
        result.push(Color.fromCssColorString(binColors[i]));
      } else {
        palette =
          palette ||
          ColorPalette.fromString(this.colorTraits.colorPalette, numberOfBins);
        result.push(palette.selectColor(i));
      }
    }
    return result;
  }

  @computed
  get colorMap(): ColorMap | undefined {
    const colorColumn = this.colorColumn;
    const colorTraits = this.colorTraits;

    if (colorColumn === undefined) {
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
