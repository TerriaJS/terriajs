import { action, computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import SampledPositionProperty from "terriajs-cesium/Source/DataSources/SampledPositionProperty";
import SampledProperty from "terriajs-cesium/Source/DataSources/SampledProperty";
import TimeIntervalCollectionPositionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import { ChartPoint } from "../Charts/ChartData";
import getChartColorForId from "../Charts/getChartColorForId";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import makeRealPromise from "../Core/makeRealPromise";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import RegionProvider from "../Map/RegionProvider";
import JSRegionProviderList from "../Map/RegionProviderList";
import { calculateDomain, ChartAxis, ChartItem } from "../Models/Chartable";
import CommonStrata from "../Models/CommonStrata";
import { ImageryParts } from "../Models/Mappable";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import SelectableStyle, { AvailableStyle } from "../Models/SelectableStyle";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import LegendTraits from "../Traits/LegendTraits";
import TableTraits from "../Traits/TableTraits";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import TimeIntervalCollection from "terriajs-cesium/Source/Core/TimeIntervalCollection";
import TimeIntervalCollectionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty";
import Color from "terriajs-cesium/Source/Core/Color";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createLongitudeLatitudeFeaturePerId from "../Table/createLongitudeLatitudeFeaturePerId";
import createLongitudeLatitudeFeaturePerRow from "../Table/createLongitudeLatitudeFeaturePerRow";

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
    get disableOpacityControl() {
      // disable opacity control for point tables
      return this.activeTableStyle.isPoints();
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
            key: `key${this.uniqueId}-${this.name}-${yColumn.name}`,
            type: "line",
            xAxis,
            points,
            domain: calculateDomain(points),
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

    @computed
    get rowIds(): number[] {
      const nRows = (this.dataColumnMajor?.[0]?.length || 1) - 1;
      const ids = [...new Array(nRows).keys()];
      return ids;
    }

    @computed
    get isSampled(): boolean {
      return this.activeTableStyle.timeTraits.isSampled;
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

    dispose() {
      super.dispose();
      this._dataLoader.dispose();
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

        const dataSource = new CustomDataSource(this.name || "Table");
        dataSource.entities.suspendEvents();

        let features: Entity[];
        if (style.idColumns !== undefined && style.timeColumn !== undefined) {
          features = createLongitudeLatitudeFeaturePerId(<any>style);
        } else {
          features = createLongitudeLatitudeFeaturePerRow(style);
        }

        features.forEach(f => dataSource.entities.add(f));
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
          imageryProvider: new MapboxVectorTileImageryProvider({
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
            uniqueIdProp: regionType.uniqueIdProp,
            featureInfoFunc: (feature: any) => {
              if (
                isDefined(style.regionColumn) &&
                isDefined(style.regionColumn.regionType) &&
                isDefined(style.regionColumn.regionType.regionProp)
              ) {
                const regionColumn = style.regionColumn;
                const regionType = regionColumn.regionType;

                if (!isDefined(regionType)) return undefined;

                const regionId: any = regionColumn.valuesAsRegions.regionIdToRowNumbersMap.get(
                  feature.properties[regionType.regionProp]
                );
                let d = null;

                // TODO - find a better way to handle time-varying feature info's
                if (Array.isArray(regionId)) {
                  d = this.getRowValues(regionId[0]);
                } else {
                  d = this.getRowValues(regionId);
                }
                return this.featureInfoFromFeature(
                  regionType,
                  d,
                  feature.properties[regionType.uniqueIdProp]
                );
              }

              return undefined;
            }
          }),
          show: this.show
        };
      }
    );

    private featureInfoFromFeature(
      region: RegionProvider,
      data: JsonObject,
      regionId: any
    ) {
      const featureInfo = new ImageryLayerFeatureInfo();
      if (isDefined(region.nameProp)) {
        featureInfo.name = data[region.nameProp] as string;
      }

      data.id = regionId;
      featureInfo.data = data;

      featureInfo.configureDescriptionFromProperties(data);
      featureInfo.configureNameFromProperties(data);
      return featureInfo;
    }

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

// function generateFeatureFromSingleRow() {}

// function generateFeatureFromMultipleRows(
//   rowIds: number[],
//   style: TableStyleWithLatLngColumns,
//   idColumns: TableColumn[],
//   timeColumn: TableColumn
// ) {
//   const isSampled = style.timeTraits.isSampled;
//   const shouldInterpolateColorAndSize =
//     isSampled &&
//     style.tableModel.tableColumns.find(
//       col => col.type === TableColumnType.scalar
//     );

//   const availability = new TimeIntervalCollection();
//   const properties = new TimeIntervalCollectionProperty();
//   const description = new TimeIntervalCollectionProperty();

//   const position = isSampled
//     ? new SampledPositionProperty()
//     : new TimeIntervalCollectionPositionProperty();

//   // Color and size are never interpolated when they are drawn from a text column.
//   const [color, scale, pixelSize] = shouldInterpolateColorAndSize
//     ? [
//         new SampledProperty(Color),
//         new SampledProperty(Number),
//         new SampledProperty(Number)
//       ]
//     : [
//         new TimeIntervalCollectionProperty(),
//         new TimeIntervalCollectionProperty(),
//         new TimeIntervalCollectionProperty()
//       ];

//   const dates = timeColumn.valuesAsJulianDates.values;
//   const intervals = style.timeIntervals;
//   const longitudes = style.longitudeColumn.valuesAsNumbers.values;
//   const latitudes = style.latitudeColumn.valuesAsNumbers.values;
//   rowIds.forEach(rowId => {
//     const date = dates[rowId];
//     const interval = timeIntervals[rowId];
//     const longitude = longitudes[rowId];
//     const latitude = latitudes[rowId];

//     if (longitude === null || latitude === null) {
//       return;
//     }

//     const point = Cartesian3.fromDegrees(longitude, latitude, 0.0);
//     if (isSampledProperty(position)) {
//       position.addSample(date, point);
//     } else {
//       position.intervals.addInterval(cloneInterval(interval, point));
//     }
//   });
// }

// function isSampledProperty(prop: any): prop is SampledProperty {
//   return prop instanceof SampledProperty;
// }

// function cloneInterval(interval: TimeInterval, data: any) {
//   const cloned = interval.clone();
//   cloned.data = data;
//   return cloned;
// }

// function generateFeatureFromMultipleRows(
//   rowIds: number[],
//   style: TableStyleWithLatLngColumns,
//   idColumns: TableColumn[],
//   timeColumn: TableColumn
// ) {
//   let position:
//     | SampledPositionProperty
//     | TimeIntervalCollectionPositionProperty;
//   if (style.timeTraits.isSampled) {
//     position = new SampledPositionProperty();
//   } else {
//     position = new TimeIntervalCollectionPositionProperty();
//   }

//   const shouldInterpolateColorAndSize =
//     isSampled && defined(specialColumns.value) && !specialColumns.value.isEnum;
//   let color, scale, pixelSize;
//   if (shouldInterpolateColorAndSize) {
//     color = new SampledProperty(Color);
//     scale = new SampledProperty(Number);
//     pixelSize = new SampledProperty(Number);
//   } else {
//     color = new TimeIntervalCollectionProperty();
//     scale = new TimeIntervalCollectionProperty();
//     pixelSize = new TimeIntervalCollectionProperty();
//   }
//   const properties = new TimeIntervalCollectionProperty();
//   const description = new TimeIntervalCollectionProperty();

//   rowIds.forEach(rowId => {
//     const date = timeColumn.valuesAsJulianDates.values[rowId];
//     const interval = style.timeIntervals[rowId];
//     const longitude = style.longitudeColumn.valuesAsNumbers.values[rowId];
//     const latitude = style.latitudeColumn.valuesAsNumbers.values[rowId];

//     if (longitude === null || latitude === null) {
//       return;
//     }

//     const point = Cartesian3.fromDegrees(longitude, latitude, 0.0);
//     if (isSampled(position)) {
//       position.addSample(date, point);
//     } else {
//       position.intervals.addInterval(cloneInterval(interval, point));
//     }
//   });

//   const pointGraphics = new PointGraphics({
//     color,
//     outlineColor,
//     pixelSize,
//     show,
//     outlineWidth: 1,
//     heightReference: HeightReference.CLAMP_TO_GROUND
//   });
//   return new Entity({
//     position,
//     point: pointGraphics,
//     availability
//   });
// }

// class GenerateOneFeatuerPerId {
//   constructor(
//     readonly style: TableStyleWithLatLngColumns,
//     readonly idColumns: TableColumn[],
//     readonly timeColumn: TableColumn
//   ) {}

//   @computed
//   get rowsGroupedById() {
//     const nRows = this.timeColumn.values.length;
//     const rowIds = [...new Array(nRows).keys()];
//     return groupBy(rowIds, rowId =>
//       this.idColumns.map(col => col.values[rowId]).join("-")
//     );
//   }

//   @computed
//   get features(): Entity[] {
//     return this.rowsGroupedById.map(rowIds =>
//       this.createFeatureFromRows(rowIds)
//     );
//   }

//   createFeatureFromRows(rowIds: number[]) {
//     return new Entity({
//       position,

//     })
//   }
// }

// class GenerateOneFeaturePerRow {
//   constructor(readonly style: TableStyleWithLatLngColumns) {}

//   @computed
//   get features(): Entity[] {
//     return [];
//   }
// }

// function addOneFeaturePerId(
//   dataSource: DataSource,
//   style: TableStyleWithLatLngColumns,
//   idColumns: TableColumn[],
//   timeColumn: TableColumn
// ) {
//   const nRows = timeColumn.values.length;
//   const rowIds = [...new Array(nRows).keys()];
//   const rowsForFeatures = groupBy(rowIds, rowId =>
//     idColumns.map(col => col.values[rowId]).join("-")
//   );
//   rowsForFeatures.forEach(rows => dataSource.entities.add(createFeature(rows)));
// }
