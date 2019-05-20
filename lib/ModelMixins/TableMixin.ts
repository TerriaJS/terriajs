import { computed, observable } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import { ImageryParts } from "../Models/Mappable";
import Model from "../Models/Model";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import TableTraits from "../Traits/TableTraits";
import ConstantColorMap from "../Map/ConstantColorMap";

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
        this.createLongitudeLatitudeDataSource(style)
      ]);
    }

    private readonly createLongitudeLatitudeDataSource = createTransformer(
      (style: TableStyle): DataSource | undefined => {
        if (!style.isPoints()) {
          return undefined;
        }

        const longitudes = style.longitudeColumn.valuesAsNumbers.values;
        const latitudes = style.latitudeColumn.valuesAsNumbers.values;

        const colorColumn = style.colorColumn;
        const valueFunction = colorColumn !== undefined ? colorColumn.valueFunctionForType : () => null;

        const dataSource = new CustomDataSource(this.name || "Table");

        let colorMap = this.activeTableStyle ? this.activeTableStyle.colorMap : undefined;
        if (colorMap === undefined) {
          colorMap = new ConstantColorMap(Color.RED);
        }

        const outlineColor = Color.fromCssColorString(style.colorTraits.outlineColor);

        dataSource.entities.suspendEvents();

        for (let i = 0; i < longitudes.length && i < latitudes.length; ++i) {
          const longitude = longitudes[i];
          const latitude = latitudes[i];
          const value = valueFunction(i);
          if (longitude === null || latitude === null) {
            continue;
          }

          dataSource.entities.add(
            new Entity({
              position: Cartesian3.fromDegrees(longitude, latitude, 0.0),
              point: new PointGraphics({
                color: colorMap.mapValueToColor(value),
                pixelSize: 5,
                outlineWidth: 1,
                outlineColor: outlineColor
              })
            })
          );
        }

        dataSource.entities.resumeEvents();

        return dataSource;
      }
    );

    findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
      return this.tableColumns.find(column => column.type === type);
    }

    findColumnByName(name: string): TableColumn | undefined {
      return this.tableColumns.find(column => column.name === name);
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
