import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import Csv from "../../../Table/Csv";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import CsvCatalogItemTraits from "../../../Traits/TraitsClasses/CsvCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//
export default class CsvCatalogItem
  extends AutoRefreshingMixin(
    TableMixin(UrlMixin(CreateModel(CsvCatalogItemTraits)))
  )
  implements HasLocalData
{
  static get type() {
    return "csv";
  }

  private _csvFile?: File;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    makeObservable(this);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  get type() {
    return CsvCatalogItem.type;
  }

  setFileInput(file: File) {
    this._csvFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._csvFile);
  }

  @override
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  @override
  get _canExportData() {
    return (
      isDefined(this._csvFile) ||
      isDefined(this.csvString) ||
      isDefined(this.url)
    );
  }

  protected async _exportData() {
    if (isDefined(this._csvFile)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: this._csvFile
      };
    }
    if (isDefined(this.csvString)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: new Blob([this.csvString])
      };
    }

    if (isDefined(this.url)) {
      return this.url;
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
  }

  /*
   * The polling URL to use for refreshing data.
   */
  @computed get refreshUrl() {
    return this.polling.url || this.url;
  }

  /*
   * Called by AutoRefreshingMixin to get the polling interval
   */
  @override
  get refreshInterval() {
    if (this.refreshUrl) {
      return this.polling.seconds;
    }
  }

  /*
   * Hook called by AutoRefreshingMixin to refresh data.
   *
   * The refresh happens only if a `refreshUrl` is defined.
   * If `shouldReplaceData` is true, then the new data replaces current data,
   * otherwise new data is appended to current data.
   */
  refreshData() {
    if (!this.refreshUrl) {
      return;
    }

    Csv.parseUrl(
      proxyCatalogItemUrl(this, this.refreshUrl),
      true,
      this.ignoreRowsStartingWithComment
    ).then((dataColumnMajor) => {
      runInAction(() => {
        if (this.polling.shouldReplaceData) {
          this.dataColumnMajor = dataColumnMajor;
        } else {
          this.append(dataColumnMajor);
        }
      });
    });
  }

  private normalizeContent(csv: string): string {
    const firstLine = csv.split("\n")[0];
    const separator = firstLine.includes(";") ? ";" : ",";

    if (separator === ";") {
      return csv.replace(/(\d),(\d)/g, "$1.$2").replace(/;/g, ",");
    }

    return csv;
  }

  public async forceLoadTableData(): Promise<string[][]> {
    if (this.csvString !== undefined) {
      const normalized = this.normalizeContent(this.csvString);
      return Csv.parseString(
        normalized,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this._csvFile !== undefined) {
      const text = await this._csvFile.text();
      const normalized = this.normalizeContent(text);
      return Csv.parseString(
        normalized,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this.url !== undefined) {
      const response = await fetch(proxyCatalogItemUrl(this, this.url));
      const text = await response.text();
      const normalized = this.normalizeContent(text);
      return Csv.parseString(
        normalized,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else {
      return Promise.reject(
        new TerriaError({
          sender: this,
          title: i18next.t("models.csv.unableToLoadItemTitle"),
          message: i18next.t("models.csv.unableToLoadItemMessage")
        })
      );
    }
  }

  public async sampleFromCsvData(): Promise<void> {
    const data = await this.forceLoadTableData();

    const columns = data.reduce((acc, row) => {
      const [columnName, ...values] = row;
      acc[columnName] = values;
      return acc;
    }, {} as { [key: string]: any[] });

    const rawPathNotes = (columns["path_notes"] as any[]) || [];
    const longitudes = (columns["longitude"] as any[]) || [];
    const latitudes = (columns["latitude"] as any[]) || [];
    const heights = (columns["height"] as any[]) || [];
    const descriptions = (columns["description"] as any[]) || [];
    const path_notes =
      rawPathNotes.find((v) => typeof v === "string" && v.trim().length > 0) ||
      "";

    const positions = longitudes.map((longitude: number, i: number) =>
      Cartographic.fromDegrees(longitude, latitudes[i], heights[i])
    );

    if (!this.terria) {
      return;
    }
    const terrainProvider = this.terria.cesium?.scene?.terrainProvider;

    const resolvedPositions =
      terrainProvider && positions.every((pos) => pos.height < 1)
        ? await sampleTerrainMostDetailed(terrainProvider, positions)
        : positions;

    this.terria.measurableGeometryManager[
      this.terria.measurableGeometryIndex
    ].sampleFromCartographics(
      resolvedPositions,
      false,
      true,
      descriptions,
      path_notes
    );
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
