import i18next from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import { createTransformer, ITransformer } from "mobx-utils";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import { ChartPoint } from "../Charts/ChartData";
import getChartColorForId from "../Charts/getChartColorForId";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import { isLatLonHeight } from "../Core/LatLonHeight";
import makeRealPromise from "../Core/makeRealPromise";
import TerriaError from "../Core/TerriaError";
import ConstantColorMap from "../Map/ConstantColorMap";
import RegionProviderList from "../Map/RegionProviderList";
import CommonStrata from "../Models/Definition/CommonStrata";
import Model from "../Models/Definition/Model";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import SelectableDimensions, {
  SelectableDimension
} from "../Models/SelectableDimensions";
import createLongitudeLatitudeFeaturePerId from "../Table/createLongitudeLatitudeFeaturePerId";
import createLongitudeLatitudeFeaturePerRow from "../Table/createLongitudeLatitudeFeaturePerRow";
import createRegionMappedImageryProvider from "../Table/createRegionMappedImageryProvider";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import LegendTraits from "../Traits/TraitsClasses/LegendTraits";
import TableTraits from "../Traits/TraitsClasses/TableTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import ChartableMixin, {
  calculateDomain,
  ChartAxis,
  ChartItem
} from "./ChartableMixin";
import DiscretelyTimeVaryingMixin, {
  DiscreteTimeAsJS
} from "./DiscretelyTimeVaryingMixin";
import ExportableMixin, { ExportData } from "./ExportableMixin";
import { ImageryParts } from "./MappableMixin";

function TableMixin<T extends Constructor<Model<TableTraits>>>(Base: T) {
  abstract class TableMixin
    extends ExportableMixin(
      ChartableMixin(DiscretelyTimeVaryingMixin(CatalogMemberMixin(Base)))
    )
    implements SelectableDimensions {
    /**
     * The default {@link TableStyle}, which is used for styling
     * only when there are no styles defined.
     */
    readonly defaultTableStyle: TableStyle;

    constructor(...args: any[]) {
      super(...args);

      this.defaultTableStyle = new TableStyle(this);
    }

    get hasTableMixin() {
      return true;
    }

    // Always use the getter and setter for this
    @observable
    protected _dataColumnMajor: string[][] | undefined;

    /**
     * The list of region providers to be used with this table.
     */
    @observable
    regionProviderList: RegionProviderList | undefined;

    /**
     * The raw data table in column-major format, i.e. the outer array is an
     * array of columns.
     */
    @computed
    get dataColumnMajor(): string[][] | undefined {
      const dataColumnMajor = this._dataColumnMajor;
      if (
        this.removeDuplicateRows &&
        dataColumnMajor !== undefined &&
        dataColumnMajor.length >= 1
      ) {
        // De-duplication is slow and memory expensive, so should be avoided if possible.
        const rowsToRemove = new Set();
        const seenRows = new Set();
        for (let i = 0; i < dataColumnMajor[0].length; i++) {
          const row = dataColumnMajor.map(col => col[i]).join();
          if (seenRows.has(row)) {
            // Mark row for deletion
            rowsToRemove.add(i);
          } else {
            seenRows.add(row);
          }
        }

        if (rowsToRemove.size > 0) {
          return dataColumnMajor.map(col =>
            col.filter((cell, idx) => !rowsToRemove.has(idx))
          );
        }
      }
      return dataColumnMajor;
    }

    set dataColumnMajor(newDataColumnMajor: string[][] | undefined) {
      this._dataColumnMajor = newDataColumnMajor;
    }

    /**
     * Gets a {@link TableColumn} for each of the columns in the raw data.
     */
    @computed
    get tableColumns(): readonly TableColumn[] {
      if (this.dataColumnMajor === undefined) {
        return [];
      }
      return this.dataColumnMajor.map((_, i) => this.getTableColumn(i));
    }

    /**
     * Gets a {@link TableStyle} for each of the {@link styles}. If there
     * are no styles, returns an empty array.
     */
    @computed
    get tableStyles(): TableStyle[] {
      if (this.styles === undefined) {
        return [];
      }
      return this.styles.map((_, i) => this.getTableStyle(i));
    }

    /**
     * Gets the {@link TableStyleTraits#id} of the currently-active style.
     * Note that this is a trait so there is no guarantee that a style
     * with this ID actually exists. If no active style is explicitly
     * specified, the ID of the first style with a scalar color column is used.
     * If there is no such style the id of the first style of the {@link #styles}
     * is used.
     */
    @computed
    get activeStyle(): string | undefined {
      const value = super.activeStyle;
      if (value !== undefined) {
        return value;
      } else if (this.styles && this.styles.length > 0) {
        // Find and return a style with scalar color column if it exists,
        // otherwise just return the first available style id.
        const styleWithScalarColorColumn = this.styles.find(s => {
          const colName = s.color.colorColumn;
          return (
            colName &&
            this.findColumnByName(colName)?.type === TableColumnType.scalar
          );
        });
        return styleWithScalarColorColumn?.id || this.styles[0].id;
      }
      return undefined;
    }

    /**
     * Gets the active {@link TableStyle}, which is the item from {@link #tableStyles}
     * with an ID that matches {@link #activeStyle}, if any.
     */
    @computed
    get activeTableStyle(): TableStyle {
      const activeStyle = this.activeStyle;
      if (activeStyle === undefined) {
        return this.defaultTableStyle;
      }
      let ret = this.tableStyles.find(style => style.id === this.activeStyle);
      if (ret === undefined) {
        return this.defaultTableStyle;
      }

      return ret;
    }

    @computed
    get xColumn(): TableColumn | undefined {
      return this.activeTableStyle.xAxisColumn;
    }

    @computed
    get yColumns(): TableColumn[] {
      const lines = this.activeTableStyle.chartTraits.lines;
      return filterOutUndefined(
        lines.map(line =>
          line.yAxisColumn === undefined
            ? undefined
            : this.findColumnByName(line.yAxisColumn)
        )
      );
    }

    @computed
    get _canExportData() {
      return isDefined(this.dataColumnMajor);
    }

    protected async _exportData(): Promise<ExportData | undefined> {
      if (isDefined(this.dataColumnMajor)) {
        // I am assuming all columns have the same length -> so use first column
        let csvString = this.dataColumnMajor[0]
          .map((row, rowIndex) =>
            this.dataColumnMajor!.map(col => col[rowIndex]).join(",")
          )
          .join("\n");

        // Make sure we have .csv file extension
        let name = this.name || this.uniqueId || "data.csv";
        if (!/(\.csv\b)/i.test(name)) {
          name = `${name}.csv`;
        }

        return {
          name: (this.name || this.uniqueId)!,
          file: new Blob([csvString])
        };
      }

      throw new TerriaError({
        sender: this,
        message: "No data available to download."
      });
    }

    @computed
    get disableSplitter() {
      return !isDefined(this.activeTableStyle.regionColumn);
    }

    @computed
    get disableZoomTo() {
      // Disable zoom if only showing imagery parts  (eg region mapping) and no rectangle is defined
      if (
        !this.mapItems.find(
          m => m instanceof DataSource || m instanceof CustomDataSource
        ) &&
        !isDefined(this.cesiumRectangle)
      ) {
        return true;
      }
      return super.disableZoomTo;
    }

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): (DataSource | ImageryParts)[] {
      // Wait for activeTableStyle to be ready
      if (
        this.dataColumnMajor?.length === 0 ||
        !this.activeTableStyle.ready ||
        this.isLoadingMapItems
      )
        return [];

      const numRegions =
        this.activeTableStyle.regionColumn?.valuesAsRegions?.uniqueRegionIds
          ?.length ?? 0;

      // Estimate number of points based off number of rowGroups
      const numPoints = this.activeTableStyle.isPoints()
        ? this.activeTableStyle.rowGroups.length
        : 0;

      // If we have more points than regions OR we have points are are using a ConstantColorMap - show points instead of regions
      // (Using ConstantColorMap with regions will result in all regions being the same color - which isn't useful)
      if (
        (numPoints > 0 &&
          this.activeTableStyle.colorMap instanceof ConstantColorMap) ||
        numPoints > numRegions
      ) {
        const pointsDataSource = this.createLongitudeLatitudeDataSource(
          this.activeTableStyle
        );

        // Make sure there are actually more points than regions
        if (
          pointsDataSource &&
          pointsDataSource.entities.values.length > numRegions
        )
          return [pointsDataSource];
      }

      if (this.regionMappedImageryParts) return [this.regionMappedImageryParts];

      return [];
    }

    @computed
    get shortReport() {
      return this.mapItems.length === 0 &&
        this.chartItems.length === 0 &&
        !this.isLoading
        ? i18next.t("models.tableData.noData")
        : super.shortReport;
    }

    // regionMappedImageryParts and regionMappedImageryProvider are split up like this so that we aren't re-creating the imageryProvider if things like `opacity` and `show` change
    @computed get regionMappedImageryParts() {
      if (!this.regionMappedImageryProvider) return;

      return {
        imageryProvider: this.regionMappedImageryProvider,
        alpha: this.opacity,
        show: this.show,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      };
    }

    @computed get regionMappedImageryProvider() {
      return this.createRegionMappedImageryProvider({
        style: this.activeTableStyle,
        currentTime: this.currentDiscreteJulianDate
      });
    }

    /**
     * Try to resolve `regionType` to a region provider (this will also match against region provider aliases)
     */
    matchRegionType(regionType?: string): string | undefined {
      if (!isDefined(regionType)) return;
      const matchingRegionProviders = this.regionProviderList?.getRegionDetails(
        [regionType],
        undefined,
        undefined
      );
      if (matchingRegionProviders && matchingRegionProviders.length > 0) {
        return matchingRegionProviders[0].regionProvider.regionType;
      }
    }

    /**
     * Gets the items to show on a chart.
     *
     */
    @computed
    private get tableChartItems(): ChartItem[] {
      const style = this.activeTableStyle;
      if (style === undefined || !style.isChart()) {
        return [];
      }

      const xColumn = style.xAxisColumn;
      const lines = style.chartTraits.lines;
      if (xColumn === undefined || lines.length === 0) {
        return [];
      }

      const xValues: readonly (Date | number | null)[] =
        xColumn.type === TableColumnType.time
          ? xColumn.valuesAsDates.values
          : xColumn.valuesAsNumbers.values;

      const xAxis: ChartAxis = {
        scale: xColumn.type === TableColumnType.time ? "time" : "linear",
        units: xColumn.units
      };

      return filterOutUndefined(
        lines.map(line => {
          const yColumn = line.yAxisColumn
            ? this.findColumnByName(line.yAxisColumn)
            : undefined;
          if (yColumn === undefined) {
            return undefined;
          }
          const yValues = yColumn.valuesAsNumbers.values;

          const points: ChartPoint[] = [];
          for (let i = 0; i < xValues.length; ++i) {
            const x = xValues[i];
            const y = yValues[i];
            if (x === null || y === null) {
              continue;
            }
            points.push({ x, y });
          }

          if (points.length <= 1) return;

          const colorId = `color-${this.uniqueId}-${this.name}-${yColumn.name}`;

          return {
            item: this,
            name: line.name ?? yColumn.title,
            categoryName: this.name,
            key: `key${this.uniqueId}-${this.name}-${yColumn.name}`,
            type: this.chartType ?? "line",
            glyphStyle: this.chartGlyphStyle ?? "circle",
            xAxis,
            points,
            domain: calculateDomain(points),
            units: yColumn.units,
            isSelectedInWorkbench: line.isSelectedInWorkbench,
            showInChartPanel: this.show && line.isSelectedInWorkbench,
            updateIsSelectedInWorkbench: (isSelected: boolean) => {
              runInAction(() => {
                line.setTrait(
                  CommonStrata.user,
                  "isSelectedInWorkbench",
                  isSelected
                );
              });
            },
            getColor: () => {
              return line.color || getChartColorForId(colorId);
            },
            pointOnMap: isLatLonHeight(this.chartPointOnMap)
              ? this.chartPointOnMap
              : undefined
          };
        })
      );
    }

    @computed
    get chartItems() {
      // Wait for activeTableStyle to be ready
      if (!this.activeTableStyle.ready || this.isLoadingMapItems) return [];

      return filterOutUndefined([
        // If time-series region mapping - show time points chart
        this.activeTableStyle.isRegions() && this.discreteTimes?.length
          ? this.momentChart
          : undefined,
        ...this.tableChartItems
      ]);
    }

    @computed
    get selectableDimensions(): SelectableDimension[] {
      return filterOutUndefined([
        this.timeDisableDimension,
        ...super.selectableDimensions,
        this.regionColumnDimensions,
        this.regionProviderDimensions,
        this.styleDimensions,
        this.outlierFilterDimension
      ]);
    }

    /**
     * Takes {@link TableStyle}s and returns a SelectableDimension which can be rendered in a Select dropdown
     */
    @computed
    get styleDimensions(): SelectableDimension | undefined {
      if (this.mapItems.length === 0 && !this.enableManualRegionMapping) {
        return;
      }
      return {
        id: "activeStyle",
        name: "Display Variable",
        options: this.tableStyles
          .filter(style => !style.hidden || this.activeStyle === style.id)
          .map(style => {
            return {
              id: style.id,
              name: style.title
            };
          }),
        selectedId: this.activeStyle,
        allowUndefined: this.showDisableStyleOption,
        undefinedLabel: this.showDisableStyleOption
          ? i18next.t("models.tableData.styleDisabledLabel")
          : undefined,
        setDimensionValue: (stratumId: string, styleId: string) => {
          this.setTrait(stratumId, "activeStyle", styleId);
        }
      };
    }

    /**
     * Creates SelectableDimension for regionProviderList - the list of all available region providers.
     * {@link TableTraits#enableManualRegionMapping} must be enabled.
     */
    @computed
    get regionProviderDimensions(): SelectableDimension | undefined {
      if (
        !this.enableManualRegionMapping ||
        !Array.isArray(this.regionProviderList?.regionProviders) ||
        !isDefined(this.activeTableStyle.regionColumn)
      ) {
        return;
      }

      return {
        id: "regionMapping",
        name: "Region Mapping",
        options: this.regionProviderList!.regionProviders.map(
          regionProvider => {
            return {
              name: regionProvider.regionType,
              id: regionProvider.regionType
            };
          }
        ),
        allowUndefined: true,
        selectedId: this.activeTableStyle.regionColumn?.regionType?.regionType,
        setDimensionValue: (stratumId: string, regionType: string) => {
          let columnTraits = this.columns?.find(
            column => column.name === this.activeTableStyle.regionColumn?.name
          );
          if (!isDefined(columnTraits)) {
            columnTraits = this.addObject(
              stratumId,
              "columns",
              this.activeTableStyle.regionColumn!.name
            )!;
            columnTraits.setTrait(
              stratumId,
              "name",
              this.activeTableStyle.regionColumn!.name
            );
          }

          columnTraits.setTrait(stratumId, "regionType", regionType);
        }
      };
    }

    /**
     * Creates SelectableDimension for region column - the options contains a list of all columns.
     * {@link TableTraits#enableManualRegionMapping} must be enabled.
     */
    @computed
    get regionColumnDimensions(): SelectableDimension | undefined {
      if (
        !this.enableManualRegionMapping ||
        !Array.isArray(this.regionProviderList?.regionProviders)
      ) {
        return;
      }

      return {
        id: "regionColumn",
        name: "Region Column",
        options: this.tableColumns.map(col => {
          return {
            name: col.name,
            id: col.name
          };
        }),
        selectedId: this.activeTableStyle.regionColumn?.name,
        setDimensionValue: (stratumId: string, regionCol: string) => {
          this.defaultStyle.setTrait(stratumId, "regionColumn", regionCol);
        }
      };
    }

    /**
     * Creates SelectableDimension for region column - the options contains a list of all columns.
     * {@link TableColorStyleTraits#zScoreFilter} must be enabled and {@link TableColorMap#zScoreFilterValues} must detect extreme (outlier) values
     */
    @computed
    get outlierFilterDimension(): SelectableDimension | undefined {
      if (
        !this.activeTableStyle.colorTraits.zScoreFilter ||
        !this.activeTableStyle.tableColorMap.zScoreFilterValues
      ) {
        return;
      }

      return {
        id: "outlierFilter",
        options: [
          { id: "true", name: i18next.t("models.tableData.zFilterEnabled") },
          { id: "false", name: i18next.t("models.tableData.zFilterDisabled") }
        ],
        selectedId: this.activeTableStyle.colorTraits.zScoreFilterEnabled
          ? "true"
          : "false",
        setDimensionValue: (stratumId: string, value: string) => {
          updateModelFromJson(this, stratumId, {
            defaultStyle: {
              color: { zScoreFilterEnabled: value === "true" }
            }
          });
        },
        placement: "belowLegend",
        type: "checkbox"
      };
    }

    /**
     * Creates SelectableDimension to disable time - this will show if each rowGroup only has a single time
     */
    @computed
    get timeDisableDimension(): SelectableDimension | undefined {
      // Return nothing if no active time column and if the active time column has been explicitly hidden (using this.defaultStyle.time.timeColumn = null)
      // or if time column doesn't have at least one interval
      if (this.mapItems.length === 0 || !this.showDisableTimeOption) return;

      return {
        id: "disableTime",
        options: [
          {
            id: "true",
            name: i18next.t("models.tableData.timeDimensionEnabled")
          },
          {
            id: "false",
            name: i18next.t("models.tableData.timeDimensionDisabled")
          }
        ],
        selectedId:
          this.defaultStyle.time.timeColumn === null ? "false" : "true",
        setDimensionValue: (stratumId: string, value: string) => {
          // We have to set showDisableTimeOption to true - or this will hide when time column is disabled
          this.setTrait(stratumId, "showDisableTimeOption", true);
          this.defaultStyle.time.setTrait(
            stratumId,
            "timeColumn",
            value === "true" ? undefined : null
          );
        },
        type: "checkbox"
      };
    }

    @computed
    get rowIds(): number[] {
      const nRows = (this.dataColumnMajor?.[0]?.length || 1) - 1;
      const ids = [...new Array(nRows).keys()];
      return ids;
    }

    @computed
    get isSampled(): boolean {
      return this.activeTableStyle.isSampled;
    }

    @computed
    get discreteTimes():
      | { time: string; tag: string | undefined }[]
      | undefined {
      if (!this.activeTableStyle.moreThanOneTimeInterval) return;
      const dates = this.activeTableStyle.timeColumn?.valuesAsDates.values;
      if (dates === undefined) {
        return;
      }
      const times = filterOutUndefined(
        dates.map(d =>
          d ? { time: d.toISOString(), tag: undefined } : undefined
        )
      ).reduce(
        // is it correct for discrete times to remove duplicates?
        // see discussion on https://github.com/TerriaJS/terriajs/pull/4577
        // duplicates will mess up the indexing problem as our `<DateTimePicker />`
        // will eliminate duplicates on the UI front, so given the datepicker
        // expects uniques, return uniques here
        (acc: DiscreteTimeAsJS[], time) =>
          !acc.some(
            accTime => accTime.time === time.time && accTime.tag === time.tag
          )
            ? [...acc, time]
            : acc,
        []
      );
      return times;
    }

    @computed
    get legends(): Model<LegendTraits>[] {
      // Only return legends if we have rows in dataColumnMajor and mapItems to show
      if (this.dataColumnMajor?.length !== 0 && this.mapItems.length > 0) {
        const colorLegend = this.activeTableStyle.colorTraits.legend;
        return filterOutUndefined([colorLegend]);
      } else {
        return [];
      }
    }

    findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
      return this.tableColumns.find(column => column.type === type);
    }

    findColumnByName(name: string): TableColumn | undefined {
      return this.tableColumns.find(column => column.name === name);
    }

    protected async forceLoadMapItems() {
      try {
        const dataColumnMajor = await this.forceLoadTableData();

        // We need to make sure the region provider is loaded before loading
        // region mapped tables.
        await this.loadRegionProviderList();

        if (dataColumnMajor !== undefined && dataColumnMajor !== null) {
          runInAction(() => {
            this.dataColumnMajor = dataColumnMajor;
          });
        }

        // Load region IDS if region mapping
        const activeRegionType = this.activeTableStyle.regionColumn?.regionType;
        if (activeRegionType) {
          await activeRegionType.loadRegionIDs();
        }
      } catch (e) {
        // Clear data if error occurs
        runInAction(() => {
          this.dataColumnMajor = undefined;
        });
        throw e;
      }
    }

    /**
     * Forces load of the table data. This method does _not_ need to consider
     * whether the table data is already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called, and `regionProviderList` is set.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     */
    protected abstract forceLoadTableData(): Promise<string[][] | undefined>;

    async loadRegionProviderList() {
      if (isDefined(this.regionProviderList)) return;

      const regionProviderList:
        | RegionProviderList
        | undefined = await makeRealPromise(
        RegionProviderList.fromUrl(
          this.terria.configParameters.regionMappingDefinitionsUrl,
          this.terria.corsProxy
        )
      );
      runInAction(() => (this.regionProviderList = regionProviderList));
    }

    /*
     * Appends new table data in column major format to this table.
     * It is assumed that the column order is the same for both the tables.
     */
    @action
    append(dataColumnMajor2: string[][]) {
      if (
        this.dataColumnMajor !== undefined &&
        this.dataColumnMajor.length !== dataColumnMajor2.length
      ) {
        throw new DeveloperError(
          "Cannot add tables with different numbers of columns."
        );
      }

      const appended = this.dataColumnMajor || [];
      dataColumnMajor2.forEach((newRows, col) => {
        if (appended[col] === undefined) {
          appended[col] = [];
        }
        appended[col].push(...newRows);
      });
      this.dataColumnMajor = appended;
    }

    private readonly createLongitudeLatitudeDataSource = createTransformer(
      (style: TableStyle): DataSource | undefined => {
        if (!style.isPoints()) {
          return undefined;
        }

        const dataSource = new CustomDataSource(this.name || "Table");
        dataSource.entities.suspendEvents();

        let features: Entity[];
        if (style.isTimeVaryingPointsWithId()) {
          features = createLongitudeLatitudeFeaturePerId(style);
        } else {
          features = createLongitudeLatitudeFeaturePerRow(style);
        }

        // _catalogItem property is needed for some feature picking functions (eg FeatureInfoMixin)
        features.forEach(f => {
          (f as any)._catalogItem = this;
          dataSource.entities.add(f);
        });
        dataSource.show = this.show;
        dataSource.entities.resumeEvents();
        return dataSource;
      }
    );

    private readonly createRegionMappedImageryProvider = createTransformer(
      (input: {
        style: TableStyle;
        currentTime: JulianDate | undefined;
      }): ImageryProvider | undefined =>
        createRegionMappedImageryProvider(input.style, input.currentTime)
    );

    private readonly getTableColumn: ITransformer<
      number,
      TableColumn
    > = createTransformer((index: number) => {
      return new TableColumn(this, index);
    });

    private readonly getTableStyle: ITransformer<
      number,
      TableStyle
    > = createTransformer((index: number) => {
      return new TableStyle(this, index);
    });
  }

  return TableMixin;
}

namespace TableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof TableMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasTableMixin;
  }
}

export default TableMixin;
