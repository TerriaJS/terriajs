import createStratumInstance from "../Models/createStratumInstance";
import CsvCatalogItem from "../Models/CsvCatalogItem";
import LoadableStratum from "../Models/LoadableStratum";
import StratumFromTraits from "../Models/StratumFromTraits";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableColumnType from "./TableColumnType";
import LegendTraits, {
  LegendItemTraits,
  GradientColorStopTraits
} from "../Traits/LegendTraits";
import { computed } from "mobx";
import { createTransformer } from "mobx-utils";
import DiscreteColorMap from "../Map/DiscreteColorMap";
import TableStyle from "./TableStyle";
import EnumColorMap from "../Map/EnumColorMap";
import ContinuousColorMap from "../Map/ContinuousColorMap";
import isDefined from "../Core/isDefined";

export default class TableAutomaticStylesStratum extends LoadableStratum(
  CsvCatalogItemTraits
) {
  constructor(readonly catalogItem: CsvCatalogItem) {
    super();
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

    return createStratumInstance(TableStyleTraits, {
      longitudeColumn:
        longitudeColumn && latitudeColumn ? longitudeColumn.name : undefined,
      latitudeColumn:
        longitudeColumn && latitudeColumn ? latitudeColumn.name : undefined,
      regionColumn: regionColumn ? regionColumn.name : undefined
    });
  }

  @computed
  get styles(): StratumFromTraits<TableStyleTraits>[] {
    // Create a style to color by every scalar and enum.
    const columns = this.catalogItem.tableColumns.filter(
      column =>
        column.type === TableColumnType.scalar ||
        column.type === TableColumnType.enum
    );

    return columns.map((column, i) =>
      createStratumInstance(TableStyleTraits, {
        id: column.name,
        color: createStratumInstance(TableColorStyleTraits, {
          colorColumn: column.name,
          legend: this._createLegendForColorStyle(i)
        })
      })
    );
  }

  private readonly _createLegendForColorStyle = createTransformer(
    (i: number) => {
      return new ColorStyleLegend(this.catalogItem, i);
    }
  );
}

class ColorStyleLegend extends LoadableStratum(LegendTraits) {
  constructor(readonly catalogItem: CsvCatalogItem, readonly index: number) {
    super();
  }

  @computed
  get gradientColorStops() {
    const activeStyle = this.catalogItem.activeTableStyle;
    if (activeStyle === undefined) {
      return;
    }

    const colorMap = activeStyle.colorMap;
    if (colorMap instanceof ContinuousColorMap) {
      return colorMap.colorStops.map(stop => {
        return createStratumInstance(GradientColorStopTraits, {
          offset: stop.offset,
          color: stop.color.toCssColorString()
        });
      });
    }
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    const activeStyle = this.catalogItem.activeTableStyle;
    if (activeStyle === undefined) {
      return [];
    }

    const colorMap = activeStyle.colorMap;
    if (colorMap instanceof ContinuousColorMap) {
      return this._createLegendItemsFromContinuousColorMap(
        activeStyle,
        colorMap
      );
    } else if (colorMap instanceof DiscreteColorMap) {
      return this._createLegendItemsFromDiscreteColorMap(activeStyle, colorMap);
    } else if (colorMap instanceof EnumColorMap) {
      return this._createLegendItemsFromEnumColorMap(activeStyle, colorMap);
    }

    return [];
  }

  private _createLegendItemsFromContinuousColorMap(
    activeStyle: TableStyle,
    colorMap: ContinuousColorMap
  ) {
    const ticks =
      activeStyle.colorTraits.legendTicks === undefined
        ? 3
        : activeStyle.colorTraits.legendTicks;
    const segments = ticks + 2;
    const items = [];
    for (let i = 0; i <= segments; i++) {
      let value;
      if (i === 0) {
        value = colorMap.minimumValue;
      } else {
        value =
          colorMap.minimumValue +
          (colorMap.maximumValue - colorMap.minimumValue) * (i / segments);
      }

      items.push(
        createStratumInstance(LegendItemTraits, {
          title: "-" + this._formatValue(value),
          isGradientItem: true
        })
      );
    }

    const colorColumn = activeStyle.colorColumn;
    const nullSegment =
      colorColumn &&
      colorColumn.valuesAsNumbers.numberOfValidNumbers <
        colorColumn.valuesAsNumbers.values.length
        ? [
            createStratumInstance(LegendItemTraits, {
              title: isDefined(activeStyle.colorTraits.nullLabel)
                ? activeStyle.colorTraits.nullLabel
                : "(No Value)",
              color: activeStyle.colorTraits.nullColor,
              addSpacingAbove: true
            })
          ]
        : [];
    return items.reverse().concat(nullSegment);
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
          ? this._formatValue(minimum)
          : this._formatValue(colorMap.maximums[i - 1]);
        const formattedMax = this._formatValue(maximum);
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

    return colorMap.values
      .map((value, i) => {
        return createStratumInstance(LegendItemTraits, {
          title: value,
          color: colorMap.colors[i].toCssColorString()
        });
      })
      .concat(nullBin);
  }

  private _formatValue(value: number): string {
    return Math.round(value).toString();
  }
}
