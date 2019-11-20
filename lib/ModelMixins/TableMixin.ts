import { action, computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import ChartData, { ChartPoint } from "../Charts/ChartData";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import { JsonObject } from "../Core/Json";
import makeRealPromise from "../Core/makeRealPromise";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import JSRegionProviderList from "../Map/RegionProviderList";
import { ChartAxis, ChartItem, ChartItemType } from "../Models/Chartable";
import { ImageryParts } from "../Models/Mappable";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import SelectableStyle, { AvailableStyle } from "../Models/SelectableStyle";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import LegendTraits from "../Traits/LegendTraits";
import TableTraits from "../Traits/TableTraits";
import getChartColorForId from "../Charts/getChartColorForId";
import CommonStrata from "../Models/CommonStrata";

// TypeScript 3.6.3 can't tell JSRegionProviderList is a class and reports
//   Cannot use namespace 'JSRegionProviderList' as a type.ts(2709)
// This is a dodgy workaround.
class RegionProviderList extends JSRegionProviderList {}

export default function TableMixin<T extends Constructor<Model<TableTraits>>>(
  Base: T
) {
  abstract class TableMixin extends Base {
    /**
     * The raw data table in column-major format, i.e. the outer array is an
     * array of columns.
     */
    @observable
    dataColumnMajor: string[][] | undefined;

    /**
     * The list of region providers to be used with this table.
     */
    @observable
    regionProviderList: RegionProviderList | undefined;

    private _dataLoader = new AsyncLoader(this.forceLoadTableMixin.bind(this));

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
     * Gets the default {@link TableStyle}, which is used for styling
     * only when there are no styles defined.
     */
    @computed
    get defaultTableStyle(): TableStyle {
      return new TableStyle(this, -1);
    }

    /**
     * Gets the {@link TableStyleTraits#id} of the currently-active style.
     * Note that this is a trait so there is no guarantee that a style
     * with this ID actually exists. If no active style is explicitly
     * specified, the ID of the first of the {@link #styles} is used.
     */
    @computed
    get activeStyle(): string | undefined {
      const value = super.activeStyle;
      if (value !== undefined) {
        return value;
      } else if (this.styles && this.styles.length > 0) {
        return this.styles[0].id;
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

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): (DataSource | ImageryParts)[] {
      const result: (DataSource | ImageryParts)[] = [];

      return filterOutUndefined([
        this.createLongitudeLatitudeDataSource(this.activeTableStyle),
        this.createRegionMappedImageryLayer(this.activeTableStyle)
      ]);
    }

    /**
     * Gets the items to show on a chart.
     *
     */
    @computed
    get chartItems(): ChartItem[] {
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
        units: xColumn.traits.units
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

          const colorId = `color-${this.name}-${yColumn.name}`;

          return {
            item: this,
            name: yColumn.name,
            categoryName: this.name,
            type: ChartItemType.line,
            xAxis,
            points,
            units: yColumn.traits.units,
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
            }
          };
        })
      );
    }

    @computed
    get styleSelector(): SelectableStyle | undefined {
      if (this.mapItems.length === 0) {
        return;
      }

      const tableModel = this;
      return {
        get id(): string {
          return "style";
        },
        get name(): string {
          return "";
        },
        get availableStyles(): readonly AvailableStyle[] {
          return tableModel.tableStyles.map(style => {
            return {
              id: style.id,
              name: style.styleTraits.title || style.id
            };
          });
        },
        get activeStyleId(): string | undefined {
          return tableModel.activeStyle;
        },
        chooseActiveStyle(stratumId: string, styleId: string) {
          tableModel.setTrait(stratumId, "activeStyle", styleId);
        }
      };
    }

    get legends(): readonly ModelPropertiesFromTraits<LegendTraits>[] {
      if (this.mapItems.length > 0) {
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

    protected abstract forceLoadTableData(): Promise<string[][]>;

    private forceLoadTableMixin(): Promise<void> {
      const regionProvidersPromise: Promise<
        RegionProviderList | undefined
      > = makeRealPromise(
        RegionProviderList.fromUrl(
          this.terria.configParameters.regionMappingDefinitionsUrl,
          this.terria.corsProxy
        )
      );
      const dataPromise = this.forceLoadTableData();
      return Promise.all([regionProvidersPromise, dataPromise]).then(
        ([regionProviderList, dataColumnMajor]) => {
          runInAction(() => {
            this.regionProviderList = regionProviderList;
            this.dataColumnMajor = dataColumnMajor;
          });
        }
      );
    }

    protected forceLoadChartItems() {
      return this._dataLoader.load();
    }

    protected forceLoadMapItems() {
      return this._dataLoader.load();
    }

    /*
     * Appends new table data in column major format to this table.
     * It is assumed that thhe column order is the same for both the tables.
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

        const longitudes = style.longitudeColumn.valuesAsNumbers.values;
        const latitudes = style.latitudeColumn.valuesAsNumbers.values;

        const colorColumn = style.colorColumn;
        const valueFunction =
          colorColumn !== undefined
            ? colorColumn.valueFunctionForType
            : () => null;

        const colorMap = (this.activeTableStyle || this.defaultTableStyle)
          .colorMap;

        const outlineColor = Color.fromCssColorString(
          "white" //this.terria.baseMapContrastColor;
        );

        const dataSource = new CustomDataSource(this.name || "Table");
        dataSource.entities.suspendEvents();

        for (let i = 0; i < longitudes.length && i < latitudes.length; ++i) {
          const longitude = longitudes[i];
          const latitude = latitudes[i];
          const value = valueFunction(i);
          if (longitude === null || latitude === null) {
            continue;
          }

          const entity = dataSource.entities.add(
            new Entity({
              position: Cartesian3.fromDegrees(longitude, latitude, 0.0),
              point: new PointGraphics({
                color: colorMap.mapValueToColor(value),
                pixelSize: 15,
                outlineWidth: 1,
                outlineColor: outlineColor
              })
            })
          );
          entity.properties = this.getRowValues(i);
        }

        dataSource.show = this.show;
        dataSource.entities.resumeEvents();
        return dataSource;
      }
    );

    private readonly createRegionMappedImageryLayer = createTransformer(
      (style: TableStyle): ImageryParts | undefined => {
        if (!style.isRegions()) {
          return undefined;
        }

        const regionColumn = style.regionColumn;
        const regionType: any = regionColumn.regionType;
        if (regionType === undefined) {
          return undefined;
        }

        const baseMapContrastColor = "white"; //this.terria.baseMapContrastColor;

        const colorColumn = style.colorColumn;
        const valueFunction =
          colorColumn !== undefined
            ? colorColumn.valueFunctionForType
            : () => null;
        const colorMap = (this.activeTableStyle || this.defaultTableStyle)
          .colorMap;
        const valuesAsRegions = regionColumn.valuesAsRegions;

        return {
          alpha: this.opacity,
          imageryProvider: <any>new MapboxVectorTileImageryProvider({
            url: regionType.server,
            layerName: regionType.layerName,
            styleFunc: function(feature: any) {
              const featureRegion = feature.properties[regionType.regionProp];
              const regionIdString =
                featureRegion !== undefined && featureRegion !== null
                  ? featureRegion.toString()
                  : "";
              const rowNumbers = valuesAsRegions.regionIdToRowNumbersMap.get(
                regionIdString.toLowerCase()
              );
              let value: string | number | null;

              if (rowNumbers === undefined) {
                value = null;
              } else if (typeof rowNumbers === "number") {
                value = valueFunction(rowNumbers);
              } else {
                // TODO: multiple rows have data for this region
                value = valueFunction(rowNumbers[0]);
              }

              const color = colorMap.mapValueToColor(value);
              if (color === undefined) {
                return undefined;
              }

              return {
                fillStyle: color.toCssColorString(),
                strokeStyle: baseMapContrastColor,
                lineWidth: 1,
                lineJoin: "miter"
              };
            },
            subdomains: regionType.serverSubdomains,
            rectangle: Rectangle.fromDegrees(
              regionType.bbox[0],
              regionType.bbox[1],
              regionType.bbox[2],
              regionType.bbox[3]
            ),
            minimumZoom: regionType.serverMinZoom,
            maximumNativeZoom: regionType.serverMaxNativeZoom,
            maximumZoom: regionType.serverMaxZoom,
            uniqueIdProp: regionType.uniqueIdProp
            // featureInfoFunc: addDescriptionAndProperties(
            //   regionMapping,
            //   regionIndices,
            //   regionImageryProvider
            // )
          }),
          show: this.show
        };
      }
    );

    private getRowValues(index: number): JsonObject {
      const result: JsonObject = {};

      this.tableColumns.forEach(column => {
        result[column.name] = column.values[index];
      });

      return result;
    }

    private readonly getTableColumn = createTransformer((index: number) => {
      return new TableColumn(this, index);
    });

    private readonly getTableStyle = createTransformer((index: number) => {
      return new TableStyle(this, index);
    });
  }

  return TableMixin;
}
