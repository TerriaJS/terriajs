import { computed } from "mobx";
import createStratumInstance from "../Models/createStratumInstance";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import Model from "../Models/Model";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableScaleStyleTraits from "../Traits/TableScaleStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTraits from "../Traits/TableTraits";
import TableColumn from "./TableColumn";

interface TableModel extends Model<TableTraits> {
  readonly dataColumnMajor: string[][] | undefined;
  readonly stylesWithDefaults: readonly FlattenedFromTraits<TableStyleTraits>[];
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
    return this.styleTraits.id || 'Style' + this.styleNumber;
  }

  @computed
  get styleTraits(): FlattenedFromTraits<TableStyleTraits> {
    if (this.styleNumber >= this.tableModel.stylesWithDefaults.length) {
      return createStratumInstance(TableStyleTraits);
    }
    return this.tableModel.stylesWithDefaults[this.styleNumber];
  }

  @computed
  get colorTraits(): FlattenedFromTraits<TableColorStyleTraits> {
    return (
      this.styleTraits.color || createStratumInstance(TableColorStyleTraits)
    );
  }

  @computed
  get scaleTraits(): FlattenedFromTraits<TableScaleStyleTraits> {
    return (
      this.styleTraits.scale || createStratumInstance(TableScaleStyleTraits)
    );
  }

  @computed
  get chartTraits(): FlattenedFromTraits<TableChartStyleTraits> {
    return (
      this.styleTraits.chart || createStratumInstance(TableChartStyleTraits)
    );
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

  isPoints(): this is { readonly longitudeColumn: TableColumn, readonly latitudeColumn: TableColumn } {
    return this.longitudeColumn !== undefined && this.latitudeColumn !== undefined;
  }

  @computed
  get isRegions(): boolean {
    return this.regionColumn !== undefined;
  }

  @computed
  get isChart(): boolean {
    return this.xAxisColumn !== undefined && this.yAxisColumn !== undefined;
  }

  private resolveColumn(name: string | undefined): TableColumn | undefined {
    if (name === undefined) {
      return undefined;
    }
    return this.tableModel.tableColumns.find(column => column.name === name);
  }
}
