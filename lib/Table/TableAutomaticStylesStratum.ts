import { computed } from "mobx";
import { createTransformer } from "mobx-utils";
import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import ConstantColorMap from "../Map/ConstantColorMap";
import ContinuousColorMap from "../Map/ContinuousColorMap";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import EnumColorMap from "../Map/EnumColorMap";
import TableMixin from "../ModelMixins/TableMixin";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import LegendTraits, {
  LegendItemTraits
} from "../Traits/TraitsClasses/LegendTraits";
import TableChartStyleTraits, {
  TableChartLineStyleTraits
} from "../Traits/TraitsClasses/TableChartStyleTraits";
import TableColorStyleTraits from "../Traits/TraitsClasses/TableColorStyleTraits";
import TablePointSizeStyleTraits from "../Traits/TraitsClasses/TablePointSizeStyleTraits";
import TableStyleTraits from "../Traits/TraitsClasses/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TraitsClasses/TableTimeStyleTraits";
import TableTraits from "../Traits/TraitsClasses/TableTraits";
import TableColumnType from "./TableColumnType";
import TableStyle from "./TableStyle";

const DEFAULT_ID_COLUMN = "id";

interface TableCatalogItem
  extends InstanceType<ReturnType<typeof TableMixin>> {}

export default class TableAutomaticStylesStratum extends LoadableStratum(
  TableTraits
) {
  static stratumName = "automaticTableStyles";
  constructor(readonly catalogItem: TableCatalogItem) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableAutomaticStylesStratum(
      newModel as TableCatalogItem
    ) as this;
  }

  @computed
  get defaultStyle(): StratumFromTraits<TableStyleTraits> {
    // Use the default style to select the spatial key (lon/lat, region, none i.e. chart)
    // for all styles.
    const longitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.longitude
    );
    const latitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.latitude
    );
    const regionColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.region
    );

    const timeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.time
    );

    // Set a default id column only when we also have a time column
    const idColumn =
      timeColumn && this.catalogItem.findColumnByName(DEFAULT_ID_COLUMN);

    if (
      regionColumn !== undefined ||
      (longitudeColumn !== undefined && latitudeColumn !== undefined)
    ) {
      return createStratumInstance(TableStyleTraits, {
        longitudeColumn:
          longitudeColumn && latitudeColumn ? longitudeColumn.name : undefined,
        latitudeColumn:
          longitudeColumn && latitudeColumn ? latitudeColumn.name : undefined,
        regionColumn: regionColumn ? regionColumn.name : undefined,
        time: createStratumInstance(TableTimeStyleTraits, {
          timeColumn: timeColumn?.name,
          idColumns: idColumn && [idColumn.name]
        })
      });
    }

    // This dataset isn't spatial, so see if we have a valid chart style
    if (this.defaultChartStyle) {
      return this.defaultChartStyle;
    }

    // Can't do much with this dataset.
    return createStratumInstance(TableStyleTraits);
  }

  @computed
  get defaultChartStyle(): StratumFromTraits<TableStyleTraits> | undefined {
    const timeColumns = this.catalogItem.tableColumns.filter(
      column => column.type === TableColumnType.time
    );

    const scalarColumns = this.catalogItem.tableColumns.filter(
      column => column.type === TableColumnType.scalar
    );

    const hasTime = timeColumns.length > 0;

    if (scalarColumns.length >= (hasTime ? 1 : 2)) {
      return createStratumInstance(TableStyleTraits, {
        chart: createStratumInstance(TableChartStyleTraits, {
          xAxisColumn: hasTime ? timeColumns[0].name : scalarColumns[0].name,
          lines: scalarColumns.slice(hasTime ? 0 : 1).map((column, i) =>
            createStratumInstance(TableChartLineStyleTraits, {
              yAxisColumn: column.name,
              isSelectedInWorkbench: i === 0 // activate only the first chart line by default
            })
          )
        })
      });
    }
  }

  @computed
  get styles(): StratumFromTraits<TableStyleTraits>[] {
    // Create a style to color by every scalar and enum.
    let columns = this.catalogItem.tableColumns.filter(
      column =>
        column.type === TableColumnType.scalar ||
        column.type === TableColumnType.enum
    );

    // If no styles for scalar, enum - try to create a style using region columns
    if (columns.length === 0) {
      columns = this.catalogItem.tableColumns.filter(
        column => column.type === TableColumnType.region
      );
    }

    // If still no styles - try to create a style using text columns
    if (columns.length === 0) {
      columns = this.catalogItem.tableColumns.filter(
        column => column.type === TableColumnType.text
      );
    }

    return columns.map((column, i) =>
      createStratumInstance(TableStyleTraits, {
        id: column.name,
        color: createStratumInstance(TableColorStyleTraits, {
          colorColumn: column.name,
          legend: this._createLegendForColorStyle(i)
        }),
        pointSize: createStratumInstance(TablePointSizeStyleTraits, {
          pointSizeColumn: column.name
        })
      })
    );
  }

  @computed
  get disableDateTimeSelector() {
    if (
      this.catalogItem.mapItems.length === 0 ||
      !this.catalogItem.activeTableStyle.moreThanOneTimeInterval
    )
      return true;
  }

  @computed
  get initialTimeSource() {
    return "start";
  }

  private readonly _createLegendForColorStyle = createTransformer(
    (i: number) => {
      return new ColorStyleLegend(this.catalogItem, i);
    }
  );
}

export class ColorStyleLegend extends LoadableStratum(LegendTraits) {
  constructor(readonly catalogItem: TableCatalogItem, readonly index: number) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ColorStyleLegend(
      newModel as TableCatalogItem,
      this.index
    ) as this;
  }

  /** Add column title as legend title if showing a Discrete or Enum ColorMap */
  @computed get title() {
    if (
      this.catalogItem.activeTableStyle.colorMap instanceof DiscreteColorMap ||
      this.catalogItem.activeTableStyle.colorMap instanceof EnumColorMap
    )
      return this.catalogItem.activeTableStyle.title;
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    const activeStyle = this.catalogItem.activeTableStyle;
    if (activeStyle === undefined) {
      return [];
    }

    const colorMap = activeStyle.colorMap;
    if (colorMap instanceof DiscreteColorMap) {
      return this._createLegendItemsFromDiscreteColorMap(activeStyle, colorMap);
    } else if (colorMap instanceof ContinuousColorMap) {
      return this._createLegendItemsFromContinuousColorMap(
        activeStyle,
        colorMap
      );
    } else if (colorMap instanceof EnumColorMap) {
      return this._createLegendItemsFromEnumColorMap(activeStyle, colorMap);
    } else if (colorMap instanceof ConstantColorMap) {
      return this._createLegendItemsFromConstantColorMap(activeStyle, colorMap);
    }
    return [];
  }

  @computed get numberFormatOptions():
    | Intl.NumberFormatOptions
    | JsonObject
    | undefined {
    const colorColumn = this.catalogItem?.activeTableStyle?.colorColumn;
    if (colorColumn?.traits?.format) return colorColumn?.traits?.format;

    if (
      colorColumn &&
      colorColumn.type === TableColumnType.scalar &&
      isDefined(colorColumn.valuesAsNumbers.maximum) &&
      isDefined(colorColumn.valuesAsNumbers.minimum)
    ) {
      if (
        colorColumn.valuesAsNumbers.maximum -
          colorColumn.valuesAsNumbers.minimum ===
        0
      )
        return;

      // We want to show fraction digits depending on how small difference is between min and max.
      // This also takes into consideration the defualt number of legend items - 7
      // So we add an extra digit
      // For example:
      // - if difference is 10 - we wnat to show one fraction digit
      // - if difference is 1 - we want to show two fraction digits
      // - if difference is 0.1 - we want to show three fraction digits

      // log_10(20/x) achieves this (where x is difference between min and max)
      // https://www.wolframalpha.com/input/?i=log_10%2820%2Fx%29
      // We use 20 here instead of 10 to give us a more convervative value (that is, we may show an extra fraction digit even if it is not needed)
      // So when x >= 20 - we will not show any fraction digits

      // Clamp values between 0 and 5
      let fractionDigits = Math.max(
        0,
        Math.min(
          5,
          Math.ceil(
            Math.log10(
              20 /
                Math.abs(
                  colorColumn.valuesAsNumbers.maximum -
                    colorColumn.valuesAsNumbers.minimum
                )
            )
          )
        )
      );

      return {
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits
      };
    }
  }

  private _createLegendItemsFromContinuousColorMap(
    activeStyle: TableStyle,
    colorMap: ContinuousColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = activeStyle.colorColumn;

    const nullBin =
      colorColumn &&
      colorColumn.valuesAsNumbers.numberOfValidNumbers <
        colorColumn.valuesAsNumbers.values.length
        ? [
            createStratumInstance(LegendItemTraits, {
              color: activeStyle.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title: activeStyle.colorTraits.nullLabel || "(No value)"
            })
          ]
        : [];

    return new Array(7)
      .fill(0)
      .map((_, i) => {
        const value =
          colorMap.minValue + (colorMap.maxValue - colorMap.minValue) * (i / 6);
        return createStratumInstance(LegendItemTraits, {
          color: colorMap.mapValueToColor(value).toCssColorString(),
          title: this._formatValue(value, this.numberFormatOptions)
        });
      })
      .reverse()
      .concat(nullBin);
  }

  private _createLegendItemsFromDiscreteColorMap(
    activeStyle: TableStyle,
    colorMap: DiscreteColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = activeStyle.colorColumn;
    const minimum =
      colorColumn && colorColumn.valuesAsNumbers.minimum !== undefined
        ? colorColumn.valuesAsNumbers.minimum
        : 0.0;

    const nullBin =
      colorColumn &&
      colorColumn.valuesAsNumbers.numberOfValidNumbers <
        colorColumn.valuesAsNumbers.values.length
        ? [
            createStratumInstance(LegendItemTraits, {
              color: activeStyle.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title: activeStyle.colorTraits.nullLabel || "(No value)"
            })
          ]
        : [];

    return colorMap.maximums
      .map((maximum, i) => {
        const isBottom = i === 0;
        const formattedMin = isBottom
          ? this._formatValue(minimum, this.numberFormatOptions)
          : this._formatValue(
              colorMap.maximums[i - 1],
              this.numberFormatOptions
            );
        const formattedMax = this._formatValue(
          maximum,
          this.numberFormatOptions
        );
        return createStratumInstance(LegendItemTraits, {
          color: colorMap.colors[i].toCssColorString(),
          title: `${formattedMin} to ${formattedMax}`
          // titleBelow: isBottom ? minimum.toString() : undefined, // TODO: format value
          // titleAbove: maximum.toString() // TODO: format value
        });
      })
      .reverse()
      .concat(nullBin);
  }

  private _createLegendItemsFromEnumColorMap(
    activeStyle: TableStyle,
    colorMap: EnumColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = activeStyle.colorColumn;
    const nullBin =
      colorColumn && colorColumn.uniqueValues.numberOfNulls > 0
        ? [
            createStratumInstance(LegendItemTraits, {
              color: activeStyle.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title: activeStyle.colorTraits.nullLabel || "(No value)"
            })
          ]
        : [];

    // Aggregate colours (don't show multiple legend items for the same colour)
    const colorMapValues = colorMap.values.reduce<{
      [color: string]: string[];
    }>((prev, current, i) => {
      const cssCol = colorMap.colors[i].toCssColorString();
      if (isDefined(prev[cssCol])) {
        prev[cssCol].push(current);
      } else {
        prev[cssCol] = [current];
      }
      return prev;
    }, {});

    return Object.entries(colorMapValues)
      .map(([color, multipleTitles]) =>
        createStratumInstance(LegendItemTraits, {
          multipleTitles,
          color
        })
      )
      .concat(nullBin);
  }

  private _createLegendItemsFromConstantColorMap(
    activeStyle: TableStyle,
    colorMap: ConstantColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    return [
      createStratumInstance(LegendItemTraits, {
        color: colorMap.color.toCssColorString(),
        title: colorMap.title
      })
    ];
  }

  private _formatValue(
    value: number,
    format: Intl.NumberFormatOptions | JsonObject | undefined
  ): string {
    return (format?.maximumFractionDigits
      ? value
      : Math.round(value)
    ).toLocaleString(undefined, format);
  }
}
