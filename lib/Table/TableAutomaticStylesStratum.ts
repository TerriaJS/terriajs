import i18next from "i18next";
import { uniq } from "lodash-es";
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
  get disableOpacityControl() {
    // disable opacity control for point tables - or if no mapItems
    return (
      this.catalogItem.activeTableStyle.isPoints() ||
      this.catalogItem.mapItems.length === 0
    );
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
        }),
        color: createStratumInstance(TableColorStyleTraits, {
          legend: this._createLegendForColorStyle(-1)
        })
      });
    }

    // This dataset isn't spatial, so see if we have a valid chart style
    if (this.defaultChartStyle) {
      return this.defaultChartStyle;
    }

    // Can't do much with this dataset.
    // Just add default legend
    return createStratumInstance(TableStyleTraits, {
      color: createStratumInstance(TableColorStyleTraits, {
        legend: this._createLegendForColorStyle(-1)
      })
    });
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
        color: createStratumInstance(TableColorStyleTraits, {
          legend: this._createLegendForColorStyle(-1)
        }),
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

  @computed get showDisableTimeOption() {
    // Return nothing if no row groups or if time column doesn't have at least one interval
    if (
      this.catalogItem.activeTableStyle.rowGroups.length === 0 ||
      !this.catalogItem.activeTableStyle.moreThanOneTimeInterval
    )
      return undefined;

    // Return true if at least 50% of rowGroups only have one unique time interval (i.e. they don't change over time)
    let flat = 0;

    for (
      let i = 0;
      i < this.catalogItem.activeTableStyle.rowGroups.length;
      i++
    ) {
      const [rowGroupId, rowIds] = this.catalogItem.activeTableStyle.rowGroups[
        i
      ];
      // Check if there is only 1 unique date in this rowGroup
      const dates = rowIds
        .map(rowId =>
          this.catalogItem.activeTableStyle.timeColumn?.valuesAsDates.values[
            rowId
          ]?.getTime()
        )
        .filter(isDefined);
      if (uniq(dates).length <= 1) flat++;
    }

    if (flat / this.catalogItem.activeTableStyle.rowGroups.length >= 0.5)
      return true;

    return undefined;
  }

  @computed
  get initialTimeSource() {
    return "start";
  }

  /** Return title of timeColumn if defined
   * This will be displayed on DateTimeSelectorSection in the workbench
   */
  @computed get timeLabel() {
    if (this.catalogItem.activeTableStyle.timeColumn) {
      return `${this.catalogItem.activeTableStyle.timeColumn.title}: `;
    }
  }

  private readonly _createLegendForColorStyle = createTransformer(
    (i: number) => {
      return new ColorStyleLegend(this.catalogItem, i);
    }
  );
}

export class ColorStyleLegend extends LoadableStratum(LegendTraits) {
  /**
   *
   * @param catalogItem
   * @param index index of column in catalogItem (if -1 or undefined, then default style will be used)
   */
  constructor(
    readonly catalogItem: TableCatalogItem,
    readonly index?: number | undefined
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ColorStyleLegend(
      newModel as TableCatalogItem,
      this.index
    ) as this;
  }

  @computed get tableStyle() {
    if (
      isDefined(this.index) &&
      this.index !== -1 &&
      this.index < this.catalogItem.tableStyles.length
    )
      return this.catalogItem.tableStyles[this.index];

    return this.catalogItem.defaultTableStyle;
  }

  /** Add column title as legend title if showing a Discrete or Enum ColorMap */
  @computed get title() {
    if (
      this.tableStyle.colorMap instanceof DiscreteColorMap ||
      this.tableStyle.colorMap instanceof EnumColorMap
    )
      return this.tableStyle.title;
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    let items: StratumFromTraits<LegendItemTraits>[] = [];

    const colorMap = this.tableStyle.colorMap;
    if (colorMap instanceof DiscreteColorMap) {
      items = this._createLegendItemsFromDiscreteColorMap(
        this.tableStyle,
        colorMap
      );
    } else if (colorMap instanceof ContinuousColorMap) {
      items = this._createLegendItemsFromContinuousColorMap(
        this.tableStyle,
        colorMap
      );
    } else if (colorMap instanceof EnumColorMap) {
      items = this._createLegendItemsFromEnumColorMap(
        this.tableStyle,
        colorMap
      );
    } else if (colorMap instanceof ConstantColorMap) {
      items = this._createLegendItemsFromConstantColorMap(
        this.tableStyle,
        colorMap
      );
    }

    return items;
  }

  @computed get numberFormatOptions():
    | Intl.NumberFormatOptions
    | JsonObject
    | undefined {
    const colorColumn = this.tableStyle.colorColumn;
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
    style: TableStyle,
    colorMap: ContinuousColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = style.colorColumn;

    const nullBin =
      colorColumn &&
      colorColumn.valuesAsNumbers.numberOfValidNumbers <
        colorColumn.valuesAsNumbers.values.length
        ? [
            createStratumInstance(LegendItemTraits, {
              color: style.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title:
                style.colorTraits.nullLabel ||
                i18next.t("models.tableData.legendNullLabel")
            })
          ]
        : [];

    const outlierBin = style.tableColorMap.outlierColor
      ? [
          createStratumInstance(LegendItemTraits, {
            color: style.tableColorMap.outlierColor.toCssColorString(),
            addSpacingAbove: true,
            title:
              style.colorTraits.outlierLabel ||
              i18next.t("models.tableData.legendZFilterLabel")
          })
        ]
      : [];

    return new Array(7)
      .fill(0)
      .map((_, i) => {
        // Use maxValue if i === 6 so we don't get funky JS precision
        const value =
          i === 6
            ? colorMap.maxValue
            : colorMap.minValue +
              (colorMap.maxValue - colorMap.minValue) * (i / 6);
        return createStratumInstance(LegendItemTraits, {
          color: colorMap.mapValueToColor(value).toCssColorString(),
          title: this._formatValue(value, this.numberFormatOptions)
        });
      })
      .reverse()
      .concat(nullBin, outlierBin);
  }

  private _createLegendItemsFromDiscreteColorMap(
    style: TableStyle,
    colorMap: DiscreteColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = style.colorColumn;
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
              color: style.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title: style.colorTraits.nullLabel || "(No value)"
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
    style: TableStyle,
    colorMap: EnumColorMap
  ): StratumFromTraits<LegendItemTraits>[] {
    const colorColumn = style.colorColumn;
    const nullBin =
      colorColumn && colorColumn.uniqueValues.numberOfNulls > 0
        ? [
            createStratumInstance(LegendItemTraits, {
              color: style.colorTraits.nullColor || "rgba(0, 0, 0, 0)",
              addSpacingAbove: true,
              title: style.colorTraits.nullLabel || "(No value)"
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
    style: TableStyle,
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
