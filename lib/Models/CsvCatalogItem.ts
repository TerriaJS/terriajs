import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import filterOutUndefined from "../Core/filterOutUndefined";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import createFlattenedStrataView from "./createFlattenedStrataView";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import FlattenedFromTraits from "./FlattenedFromTraits";
import LoadableStratum from "./LoadableStratum";
import { ImageryParts } from "./Mappable";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//

const tableGuessesStratumName = "tableGuesses";

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
    this.strata.set(tableGuessesStratumName, new GuessesStratum(this));
  }

  get type() {
    return CsvCatalogItem.type;
  }

  @computed
  get selectedStyle(): string | undefined {
    const value = super.selectedStyle;
    if (value !== undefined) {
      return value;
    } else if (this.styles && this.styles.length > 0) {
      return this.styles[0].id;
    }
    return undefined;
  }

  @computed
  get mapItems(): (DataSource | ImageryParts)[] {
    const result: (DataSource | ImageryParts)[] = [];

    const styles = this.stylesWithDefaults;
    if (this.selectedStyle === undefined || styles === undefined) {
      return result;
    }

    const style = styles.find(style => style.id === this.selectedStyle);
    if (style === undefined) {
      return result;
    }

    return filterOutUndefined([this.createLongitudeLatitudeDataSource(style)]);
  }

  private createLongitudeLatitudeDataSource(
    style: FlattenedFromTraits<TableStyleTraits>
  ): DataSource | undefined {
    const longitudeColumnName = style.longitudeColumn;
    const latitudeColumnName = style.latitudeColumn;
    if (longitudeColumnName === undefined || latitudeColumnName === undefined) {
      return undefined;
    }

    const longitudeColumn = this.findColumnByName(longitudeColumnName);
    const latitudeColumn = this.findColumnByName(latitudeColumnName);
    if (longitudeColumn === undefined || latitudeColumn === undefined) {
      return undefined;
    }

    const longitudes = longitudeColumn.valuesAsNumbers.values;
    const latitudes = latitudeColumn.valuesAsNumbers.values;

    // const colorStyles = style.color || createStratumInstance(TableColorStyleTraits);
    // const colorColumnName = colorStyles.colorColumn;
    // const colorColumn = colorColumnName ? this.findColumnByName(colorColumnName) : undefined;

    const dataSource = new CustomDataSource(this.name || "CsvCatalogItem");

    dataSource.entities.suspendEvents();
    for (let i = 0; i < longitudes.length && i < latitudes.length; ++i) {
      const longitude = longitudes[i];
      const latitude = latitudes[i];
      if (longitude === null || latitude === null) {
        continue;
      }

      dataSource.entities.add(
        new Entity({
          position: Cartesian3.fromDegrees(longitude, latitude, 0.0),
          point: new PointGraphics({
            color: Color.RED,
            pixelSize: 5
          })
        })
      );
    }
    dataSource.entities.resumeEvents();

    return dataSource;
  }

  @computed
  get tableColumns(): TableColumn[] {
    if (this.dataColumnMajor === undefined) {
      return [];
    }

    return this.dataColumnMajor.map((_, i) => this.getTableColumn(i));
  }

  @computed
  get stylesWithDefaults(): readonly FlattenedFromTraits<TableStyleTraits>[] {
    const styles: readonly ModelPropertiesFromTraits<TableStyleTraits>[] =
      this.styles || [];
    const defaultStyle:
      | ModelPropertiesFromTraits<TableStyleTraits>
      | undefined = this.defaultStyle;
    if (defaultStyle === undefined) {
      return styles;
    }

    return styles.map(style => {
      const model = {
        id: style.id + ":with-defaults",
        strataTopToBottom: [style, defaultStyle]
      };
      return createFlattenedStrataView(model, TableStyleTraits);
    });
  }

  findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
    return this.tableColumns.find(column => column.type === type);
  }

  findColumnByName(name: string): TableColumn | undefined {
    return this.tableColumns.find(column => column.name === name);
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

    return columns.map(column =>
      createStratumInstance(TableStyleTraits, {
        id: column.name,
        color: createStratumInstance(TableColorStyleTraits, {
          colorColumn: column.name
        })
      })
    );
  }
}

StratumOrder.addLoadStratum(tableGuessesStratumName);
