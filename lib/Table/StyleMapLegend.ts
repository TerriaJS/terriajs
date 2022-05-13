import { computed } from "mobx";
import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import TableMixin from "../ModelMixins/TableMixin";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import LegendTraits, {
  LegendItemTraits
} from "../Traits/TraitsClasses/LegendTraits";
import { TableStyleMapSymbolTraits } from "../Traits/TraitsClasses/TablePointStyleTraits";
import TableStyleMap from "./TableStyleMap";

export class StyleMapLegend<
  T extends TableStyleMapSymbolTraits
> extends LoadableStratum(LegendTraits) {
  /**
   *
   * @param catalogItem
   * @param index index of column in catalogItem (if -1 or undefined, then default style will be used)
   */
  constructor(
    readonly catalogItem: TableMixin.Instance,
    readonly styleMap: TableStyleMap<T>,
    readonly getPreview: (style: T, title?: string) => Partial<LegendItemTraits>
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new StyleMapLegend(
      newModel as TableMixin.Instance,
      this.styleMap,
      this.getPreview
    ) as this;
  }

  @computed get tableStyle() {
    return this.catalogItem.activeTableStyle;
  }

  @computed get title() {
    if (
      this.styleMap.styleMap.type !== "constant" &&
      this.styleMap.column &&
      this.tableStyle.colorColumn?.name !== this.styleMap.column?.name
    ) {
      return this.styleMap.column?.title;
    }
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    let items: StratumFromTraits<LegendItemTraits>[] = [];

    if (this.styleMap.styleMap.type === "bin") {
      items = this._createLegendItemsFromBinPointStyleMap();
    } else if (this.styleMap.styleMap.type === "enum") {
      items = this._createLegendItemsFromEnumPointStyleMap();
    } else {
      items = this._createLegendItemsFromConstantColorMap();
    }

    return items;
  }

  private _createLegendItemsFromBinPointStyleMap(): StratumFromTraits<
    LegendItemTraits
  >[] {
    const column = this.styleMap.column;
    const minimum =
      column && column.valuesAsNumbers.minimum !== undefined
        ? column.valuesAsNumbers.minimum
        : 0.0;

    const nullBin =
      column &&
      column.valuesAsNumbers.numberOfValidNumbers <
        column.valuesAsNumbers.values.length
        ? [
            createStratumInstance(LegendItemTraits, {
              ...this.getPreview(this.styleMap.traitValues.null, "(No value)"),
              addSpacingAbove: true
            })
          ]
        : [];

    return this.styleMap.traitValues.bin
      .map((bin, i) => {
        const isBottom = i === 0;
        const formattedMin = isBottom
          ? this._formatValue(minimum, this.tableStyle.numberFormatOptions)
          : this._formatValue(
              this.styleMap.traitValues.bin[i - 1].maxValue,
              this.tableStyle.numberFormatOptions
            );
        const formattedMax = this._formatValue(
          bin.maxValue,
          this.tableStyle.numberFormatOptions
        );
        return createStratumInstance(
          LegendItemTraits,
          this.getPreview(bin, `${formattedMin} to ${formattedMax}`)
        );
      })
      .reverse()
      .concat(nullBin);
  }

  private _createLegendItemsFromEnumPointStyleMap(): StratumFromTraits<
    LegendItemTraits
  >[] {
    const column = this.styleMap.column;

    // Show null bin if data has null values - or if EnumColorMap doesn't have enough colors to show all values
    const nullBin =
      column &&
      (column.uniqueValues.numberOfNulls > 0 ||
        column.uniqueValues.values.find(
          value =>
            !this.styleMap.commonTraits.enum.find(
              enumStyle => enumStyle.value === value
            )
        ))
        ? [
            createStratumInstance(
              LegendItemTraits,
              this.getPreview(this.styleMap.traitValues.null, "(No value)")
            )
          ]
        : [];

    return this.styleMap.traitValues.enum
      .map(enumPoint =>
        createStratumInstance(
          LegendItemTraits,
          this.getPreview(
            enumPoint,
            enumPoint.legendTitle ?? enumPoint.value ?? "No value"
          )
        )
      )
      .concat(nullBin);
  }

  private _createLegendItemsFromConstantColorMap(): StratumFromTraits<
    LegendItemTraits
  >[] {
    return [
      createStratumInstance(
        LegendItemTraits,
        this.getPreview(
          this.styleMap.traitValues.null,
          this.catalogItem.name ?? this.catalogItem.uniqueId ?? "(No value)"
        )
      )
    ];
  }

  private _formatValue(
    value: number | null | undefined,
    format: Intl.NumberFormatOptions | JsonObject | undefined
  ): string {
    if (!isDefined(value) || value === null) return "No value";
    return (format?.maximumFractionDigits
      ? value
      : Math.round(value)
    ).toLocaleString(undefined, format);
  }
}
