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
import ExportableFormat from "../../../ViewModels/Measure/ExportableFormat";
import { MeasurableGeometry } from "../../../ViewModels/Measure/MeasurableGeometryManager";
import { DownloadLink } from "../../../ViewModels/Measure/MeasurableDownload";
import DataUri from "../../../Core/DataUri";
import CesiumMath from "terriajs-cesium/Source/Core/Math";

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
  implements HasLocalData, ExportableFormat
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

  private formatNumber(value: number | undefined, digits: number): string {
    if (typeof value !== "number" || !isFinite(value)) return "";
    return value.toFixed(digits);
  }

  private generatePointsCsvData(
    geom: MeasurableGeometry,
    name: string
  ): string {
    const isPointsOnly = geom.onlyPoints === true;
    const headers = isPointsOnly
      ? [
          "name",
          "path_notes",
          "longitude",
          "latitude",
          "height",
          "description"
        ].join(",")
      : [
          "name",
          "path_notes",
          "longitude",
          "latitude",
          "height",
          "alt_diff",
          "geodetic_distance",
          "air_distance",
          "ground_distance",
          "slope"
        ].join(",");

    if (!geom.stopPoints || geom.stopPoints.length === 0) {
      return headers;
    }

    const rows = [headers];

    const stopGeodeticDistances = geom.stopGeodeticDistances ?? [];
    const stopAirDistances = geom.stopAirDistances ?? [];
    const stopGroundDistances = geom.stopGroundDistances ?? [];

    rows.push(
      ...geom.stopPoints.map((elem, index) => {
        const baseColumns: (string | number)[] = [
          index === 0 ? name : "",
          index === 0 ? geom.pathNotes ?? "" : "",
          CesiumMath.toDegrees(elem.longitude),
          CesiumMath.toDegrees(elem.latitude),
          Math.round(elem.height)
        ];

        if (isPointsOnly) {
          return [...baseColumns, geom.pointDescriptions?.[index] || ""].join(
            ","
          );
        }

        const prev = index > 0 ? geom.stopPoints[index - 1] : undefined;

        const altDiff =
          index > 0 && prev
            ? this.formatNumber(elem.height - prev.height, 0)
            : "";

        const geodeticDistance =
          index > 0 ? this.formatNumber(stopGeodeticDistances[index], 2) : "";
        const airDistance =
          index > 0 ? this.formatNumber(stopAirDistances[index], 2) : "";
        const groundDistance =
          index > 0 ? this.formatNumber(stopGroundDistances[index], 2) : "";

        let slope = "";
        const airDistNum = stopAirDistances[index];
        if (index > 0 && prev && typeof airDistNum === "number" && airDistNum) {
          slope = Math.abs(
            (100 * (elem.height - prev.height)) / airDistNum
          ).toFixed(1);
        }

        return [
          ...baseColumns,
          altDiff,
          geodeticDistance,
          airDistance,
          groundDistance,
          slope
        ].join(",");
      })
    );

    return rows.join("\n");
  }

  async generateDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean
  ): Promise<DownloadLink[]> {
    if (isMultiPath) return [];

    return [
      {
        key: "csv",
        href: DataUri.make("csv", this.generatePointsCsvData(geom, name)),
        download: `${name}_points.csv`,
        label: "CSV"
      }
    ];
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

  public forceLoadTableData(): Promise<string[][]> {
    if (this.csvString !== undefined) {
      return Csv.parseString(
        this.csvString,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this._csvFile !== undefined) {
      return Csv.parseFile(
        this._csvFile,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this.url !== undefined) {
      return Csv.parseUrl(
        proxyCatalogItemUrl(this, this.url),
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

    const path_notes = columns["path_notes"]?.[0] || "";
    const longitudes = columns["longitude"] || [];
    const latitudes = columns["latitude"] || [];
    const heights = columns["height"] || [];
    const descriptions = columns["description"] || [];

    const positions = longitudes.map((longitude: number, i: number) =>
      Cartographic.fromDegrees(longitude, latitudes[i], heights[i])
    );

    if (!this.terria?.cesium?.scene) {
      return;
    }
    const terrainProvider = this.terria.cesium.scene.terrainProvider;

    const resolvedPositions = positions.every((pos) => pos.height < 1)
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
