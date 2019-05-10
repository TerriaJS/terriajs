import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { ImageryParts } from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//

export default class CsvCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(CsvCatalogItemTraits)))
) {
  static get type() {
    return "csv";
  }

  /**
   * The raw data table in column-major format, i.e. the outer array is an
   * array of columns.
   */
  @observable
  dataColumnMajor: string[][] | undefined;

  constructor(id: string, terria: Terria) {
    super(id, terria);
    this.strata.set("guesses TODO", new GuessesStratum(this));
  }

  get type() {
    return CsvCatalogItem.type;
  }

  @computed
  get mapItems(): (DataSource | ImageryParts)[] {
    return [];
  }

  @computed
  get tableColumns(): TableColumn[] {
    if (this.dataColumnMajor === undefined) {
      return [];
    }

    return this.dataColumnMajor.map((_, i) => this.getTableColumn(i));
  }

  findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
    return this.tableColumns.find(column => column.type === type);
  }

  protected get loadMapItemsPromise(): Promise<void> {
    return Promise.resolve()
      .then(() => {
        if (this.csvString !== undefined) {
          return Csv.parseString(this.csvString, true);
        } else if (this.url !== undefined) {
          return Csv.parseUrl(proxyCatalogItemUrl(this, this.url, "1d"), true);
        } else {
          throw new TerriaError({
            sender: this,
            title: "No CSV available",
            message:
              "The CSV catalog item cannot be loaded because it was not configured " +
              "with a `url` or `csvString` property."
          });
        }
      })
      .then(dataColumnMajor => {
        runInAction(() => {
          this.dataColumnMajor = dataColumnMajor;
        });
      });
  }

  protected get loadMetadataPromise(): Promise<void> {
    return Promise.resolve();
  }

  private readonly getTableColumn = createTransformer((index: number) => {
    return new TableColumn(this, index);
  });
}

class GuessesStratum extends LoadableStratum(CsvCatalogItemTraits) {
  constructor(readonly catalogItem: CsvCatalogItem) {
    super();
  }

  get defaultStyle(): StratumFromTraits<TableStyleTraits> | undefined {
    // Use the default style to select the spatial key (lon/lat, region, none i.e. chart)
    // for all styles.
    const longitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.longitude
    );
    const latitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.latitude
    );
    if (longitudeColumn !== undefined && latitudeColumn !== undefined) {
      return createStratumInstance(TableStyleTraits, {
        longitudeColumn: longitudeColumn.name,
        latitudeColumn: latitudeColumn.name
      });
    }

    return undefined;
  }

  get styles(): StratumFromTraits<TableStyleTraits>[] {
    // Create a style to color by every scalar and enum.
    const columns = this.catalogItem.tableColumns.filter(
      column =>
        column.type === TableColumnType.scalar ||
        column.type === TableColumnType.enum
    );

    return columns.map(column => createStratumInstance(TableStyleTraits, {
      id: column.name,
      color: createStratumInstance(TableColorStyleTraits, {
        colorColumn: column.name
      })
    }));
  }
}
