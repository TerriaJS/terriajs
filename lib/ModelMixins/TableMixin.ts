import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import { JsonObject } from "../Core/Json";
import makeRealPromise from "../Core/makeRealPromise";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import RegionProviderList from "../Map/RegionProviderList";
import { ImageryParts } from "../Models/Mappable";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import SelectableStyle, { AvailableStyle } from "../Models/SelectableStyle";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import LegendTraits from "../Traits/LegendTraits";
import TableTraits from "../Traits/TableTraits";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ChartData, { ChartPoint } from "../Charts/ChartData";

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
    get activeTableStyle(): TableStyle | undefined {
      const activeStyle = this.activeStyle;
      if (activeStyle === undefined) {
        return undefined;
      }

      return this.tableStyles.find(style => style.id === this.activeStyle);
    }

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): (DataSource | ImageryParts)[] {
      const result: (DataSource | ImageryParts)[] = [];

      const styles = this.tableStyles;
      if (this.activeStyle === undefined) {
        return result;
      }

      const style = styles.find(style => style.id === this.activeStyle);
      if (style === undefined) {
        return result;
      }

      return filterOutUndefined([
        this.createLongitudeLatitudeDataSource(style),
        this.createRegionMappedImageryLayer(style)
      ]);
    }

    @computed
    get chartItems(): ChartData[] {
      const style = this.activeTableStyle;
      if (style === undefined) {
        return [];
      }

      const xColumn = style.xAxisColumn;
      const yColumn = style.yAxisColumn;
      if (xColumn === undefined || yColumn === undefined) {
        return [];
      }

      const xValues: readonly (Date | number | null)[] =
        xColumn.type === TableColumnType.time
          ? xColumn.valuesAsDates.values
          : xColumn.valuesAsNumbers.values;
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

      const chartData = new ChartData({
        points: points
      });

      return [chartData];
    }

    @computed
    get styleSelector(): SelectableStyle {
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
      if (this.activeTableStyle === undefined) {
        return [];
      }

      const colorLegend = this.activeTableStyle.colorTraits.legend;
      return filterOutUndefined([colorLegend]);
    }

    findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
      return this.tableColumns.find(column => column.type === type);
    }

    findColumnByName(name: string): TableColumn | undefined {
      return this.tableColumns.find(column => column.name === name);
    }

    protected loadTableMixin(): Promise<void> {
      // TODO: pass proxy to fromUrl
      return makeRealPromise(
        RegionProviderList.fromUrl(
          this.terria.configParameters.regionMappingDefinitionsUrl,
          undefined
        )
      ).then(regionProviderList => {
        runInAction(() => {
          this.regionProviderList = regionProviderList;
        });
      });
    }

    private readonly createLongitudeLatitudeDataSource = createTransformer(
      (style: TableStyle): DataSource | undefined => {
        if (!style.isPoints()) {
          return undefined;
        }

        const longitudes = style.longitudeColumn.valuesAsNumbers.values;
        const latitudes = style.latitudeColumn.valuesAsNumbers.values;

        const colorColumn = style.colorColumn;

        const pointSizeColumn = style.pointSizeColumn;
        const pointSizeFactor = style.pointSizeTraits.sizeFactor;
        const pointSizeOffset = style.pointSizeTraits.sizeOffset;
        const nullPointSize = style.pointSizeTraits.nullSize;

        const colorValueFunction =
          colorColumn !== undefined
            ? colorColumn.valueFunctionForType
            : () => null;
        const pointSizeValueFunction =
          pointSizeColumn !== undefined
            ? pointSizeColumn.scaledValueFunctionForType
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
          const value = colorValueFunction(i);
          if (longitude === null || latitude === null) {
            continue;
          }

          const scaledValue = pointSizeValueFunction(i);
          const pointSize =
            scaledValue === null
              ? nullPointSize
              : scaledValue * pointSizeFactor + pointSizeOffset;

          const entity = dataSource.entities.add(
            new Entity({
              position: Cartesian3.fromDegrees(longitude, latitude, 0.0),
              point: new PointGraphics({
                color: colorMap.mapValueToColor(value),
                pixelSize: pointSize,
                outlineWidth: 1,
                outlineColor: outlineColor
              })
            })
          );
          entity.properties = this.getRowValues(i);
        }

        dataSource.entities.resumeEvents();

        return dataSource;
      }
    );

    private getRowValues(index: number): JsonObject {
      const result: JsonObject = {};

      this.tableColumns.forEach(column => {
        result[column.name] = column.values[index];
      });

      return result;
    }

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
                regionIdString
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
              const featureRegion = feature.properties[regionType.regionProp];
              const regionIdString =
                featureRegion !== undefined && featureRegion !== null
                  ? featureRegion.toString()
                  : "";
              const rowNumbers = valuesAsRegions.regionIdToRowNumbersMap.get(
                regionIdString
              );

              if (rowNumbers === undefined) {
                return undefined;
              } else if (typeof rowNumbers === "number") {
                const featureInfo = new ImageryLayerFeatureInfo();
                (<any>featureInfo).properties = {
                  ...feature.properties,
                  ...this.getRowValues(rowNumbers)
                };
                return featureInfo;
              } else {
                // TODO: multiple rows have data for this region
                const featureInfo = new ImageryLayerFeatureInfo();
                (<any>featureInfo).properties = {
                  ...feature.properties,
                  ...this.getRowValues(rowNumbers[0])
                };
                return featureInfo;
              }

              return undefined;
            }
          }),
          show: this.show
        };
      }
    );

    private readonly getTableColumn = createTransformer((index: number) => {
      return new TableColumn(this, index);
    });

    private readonly getTableStyle = createTransformer((index: number) => {
      return new TableStyle(this, index);
    });
  }

  return TableMixin;
}
