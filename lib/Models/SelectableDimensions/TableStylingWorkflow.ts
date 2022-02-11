import {
  computed,
  IReactionDisposer,
  observable,
  reaction,
  runInAction
} from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import ContinuousColorMap from "../../Map/ContinuousColorMap";
import DiscreteColorMap from "../../Map/DiscreteColorMap";
import EnumColorMap from "../../Map/EnumColorMap";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import Icon from "../../Styled/Icon";
import {
  DEFAULT_DIVERGING,
  DEFAULT_QUALITATIVE,
  DEFAULT_SEQUENTIAL,
  DIVERGING_SCALES,
  QUALITATIVE_SCALES,
  SEQUENTIAL_CONTINUOUS_SCALES,
  SEQUENTIAL_SCALES
} from "../../Table/TableColorMap";
import CommonStrata from "../Definition/CommonStrata";
import {
  SelectableDimension,
  SelectableDimensionNumeric
} from "./SelectableDimensions";
import SelectableDimensionWorkflow from "./SelectableDimensionWorkflow";

type ColorSchemeType =
  | "sequential-continuous"
  | "sequential-discrete"
  | "diverging-continuous"
  | "diverging-discrete"
  | "qualitative";

export default class TableStylingWorkflow
  implements SelectableDimensionWorkflow {
  /** This is used to simplify SelectableDimensions available to the user.
   * For example - if equal to `diverging-continuous` - then only Diverging continuous color scales will be presented as options
   * See setColorSchemeTypeFromPalette for how this is set. */
  @observable colorSchemeType: ColorSchemeType | undefined;
  private activeStyleDisposer: IReactionDisposer;

  constructor(readonly item: TableMixin.Instance) {
    // We need to reset colorSchemeType every time Table.activeStyle changes
    this.activeStyleDisposer = reaction(
      () => this.item.activeStyle,
      () => this.setColorSchemeTypeFromPalette()
    );
    this.setColorSchemeTypeFromPalette();
  }

  onClose() {
    this.activeStyleDisposer();
  }

  /** Get `TableStyleTraits` for the active table style (so we can call `setTraits`) */
  getTableStyleTraits(stratumId: string) {
    return (
      this.item.styles?.find(style => style.id === this.tableStyle.id) ??
      this.item.addObject(stratumId, "styles", this.tableStyle.id)
    );
  }

  /** Get `TableColumnTraits` for the active table style `colorColumn` (so we can call `setTraits`) */
  getTableColumnTraits(stratumId: string) {
    if (!this.tableStyle.colorColumn?.name) return;
    return (
      this.item.columns?.find(
        col => col.name === this.tableStyle.colorColumn!.name
      ) ??
      this.item.addObject(
        stratumId,
        "columns",
        this.tableStyle.colorColumn.name
      )
    );
  }

  get name() {
    return `Edit Style: ${getName(this.item)}`;
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  /** Convenience getter for item.activeTableStyle */
  @computed get tableStyle() {
    return this.item.activeTableStyle;
  }

  /** This will look at the current `colorMap` and `colorPalette` to guess which `colorSchemeType` is active.
   * This is because `TableMixin` doesn't have an explicit `"colorSchemeType"` flag - it will choose the appropriate type based on `TableStyleTraits`
   * `colorTraits.colorPalette` is also set here if we are only using `tableColorMap.defaultColorPaletteName`
   */
  setColorSchemeTypeFromPalette(): void {
    const colorMap = this.tableStyle.colorMap;
    const colorPalette = this.tableStyle.colorTraits.colorPalette;
    const defaultColorPalette = this.tableStyle.tableColorMap
      .defaultColorPaletteName;

    const colorPaletteWithDefault = colorPalette ?? defaultColorPalette;

    if (colorMap instanceof ContinuousColorMap) {
      if (
        SEQUENTIAL_SCALES.includes(colorPaletteWithDefault) ||
        SEQUENTIAL_CONTINUOUS_SCALES.includes(colorPaletteWithDefault)
      ) {
        this.colorSchemeType = "sequential-continuous";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_SEQUENTIAL
          );
        }
      } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
        this.colorSchemeType = "diverging-continuous";
        this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
          CommonStrata.user,
          "colorPalette",
          DEFAULT_DIVERGING
        );
      }
    } else if (colorMap instanceof DiscreteColorMap) {
      {
        if (SEQUENTIAL_SCALES.includes(colorPaletteWithDefault)) {
          this.colorSchemeType = "sequential-discrete";
          if (!colorPalette) {
            this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
              CommonStrata.user,
              "colorPalette",
              DEFAULT_SEQUENTIAL
            );
          }
        } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
          this.colorSchemeType = "diverging-discrete";
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_DIVERGING
          );
        }
      }
    } else if (
      colorMap instanceof EnumColorMap &&
      QUALITATIVE_SCALES.includes(colorPaletteWithDefault)
    ) {
      this.colorSchemeType = "qualitative";
      if (!colorPalette) {
        this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
          CommonStrata.user,
          "colorPalette",
          DEFAULT_QUALITATIVE
        );
      }
    }
  }

  @computed get colorSchemesForType() {
    const type = this.colorSchemeType;
    if (!isDefined(type)) return [];

    if (type === "sequential-continuous")
      return [...SEQUENTIAL_SCALES, ...SEQUENTIAL_CONTINUOUS_SCALES];
    if (type === "sequential-discrete") return SEQUENTIAL_SCALES;
    if (type === "diverging-discrete" || type === "diverging-continuous")
      return DIVERGING_SCALES;
    if (type === "qualitative") return QUALITATIVE_SCALES;

    return [];
  }

  @computed get colorSchemeSelectableDim(): SelectableDimension {
    return {
      type: "group",
      id: "Color scheme",
      selectableDimensions: [
        {
          type: "select",
          id: "Type",
          name: "Type",
          options: [
            { id: "sequential-continuous", name: "Sequential (continuous)" },
            { id: "sequential-discrete", name: "Sequential (discrete)" },
            { id: "diverging-continuous", name: "Divergent (continuous)" },
            { id: "diverging-discrete", name: "Divergent (discrete)" },
            { id: "qualitative", name: "Qualitative" }
          ],
          selectedId: this.colorSchemeType,
          setDimensionValue: (stratumId, id) => {
            runInAction(() => {
              // Set `activeStyle` trait so the value doesn't change
              this.item.setTrait(stratumId, "activeStyle", this.tableStyle.id);

              // Here we use item.activeTableStyle.colorTraits.colorPalette instead of this.colorPalette because we only want this to be defined, if the trait is defined - we don't care about defaultColorPaletteName
              const colorPalette = this.tableStyle.colorTraits.colorPalette;

              if (id === "sequential-discrete" || id === "diverging-discrete") {
                this.colorSchemeType = id;
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  "scalar"
                );
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "numberOfBins",
                  7
                );
                this.clearBinMaximums(stratumId);
              } else if (
                id === "sequential-continuous" ||
                id === "diverging-continuous"
              ) {
                this.colorSchemeType = id;
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  "scalar"
                );
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "numberOfBins",
                  undefined
                );
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "binMaximums",
                  undefined
                );
              } else if (id === "qualitative") {
                this.colorSchemeType = id;
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  "enum"
                );
              }

              // If the current colorPalette is incompatible with the selected type - change colorPalette to default for the selected type
              if (
                id === "sequential-continuous" &&
                (!colorPalette ||
                  ![
                    ...SEQUENTIAL_SCALES,
                    ...SEQUENTIAL_CONTINUOUS_SCALES
                  ].includes(colorPalette))
              ) {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorPalette",
                  DEFAULT_SEQUENTIAL
                );
              }
              if (
                id === "sequential-discrete" &&
                (!colorPalette || !SEQUENTIAL_SCALES.includes(colorPalette))
              ) {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorPalette",
                  DEFAULT_SEQUENTIAL
                );
              }
              if (
                (id === "diverging-continuous" ||
                  id === "diverging-discrete") &&
                (!colorPalette || !DIVERGING_SCALES.includes(colorPalette))
              ) {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorPalette",
                  DEFAULT_DIVERGING
                );
              }
              if (
                id === "qualitative" &&
                (!colorPalette || !QUALITATIVE_SCALES.includes(colorPalette))
              ) {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorPalette",
                  DEFAULT_QUALITATIVE
                );
              }
            });
          }
        },
        {
          type: "select",
          id: "Scheme",
          name: "Scheme",

          selectedId:
            this.tableStyle.colorTraits.colorPalette ??
            this.tableStyle.tableColorMap.defaultColorPaletteName,
          options: this.colorSchemesForType.map(style => ({
            id: style
          })),
          setDimensionValue: (stratumId, id) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "colorPalette",
              id
            );
          }
        }
      ]
    };
  }

  @computed get displayRangeSelectableDim(): SelectableDimension {
    return {
      type: "group",
      id: "Display range",
      selectableDimensions: [
        {
          type: "numeric",
          id: "min",
          name: "Min",
          max: this.tableStyle.tableColorMap.maximumValue,
          value: this.tableStyle.tableColorMap.minimumValue,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "minimumValue",
              value
            );
          }
        },
        {
          type: "numeric",
          id: "max",
          name: "Max",
          min: this.tableStyle.tableColorMap.minimumValue,
          value: this.tableStyle.tableColorMap.maximumValue,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "maximumValue",
              value
            );
          }
        }
      ]
    };
  }

  @computed get numberOfBinsSelectableDim(): SelectableDimension {
    return {
      type: "group",
      id: "Number of bins",
      selectableDimensions: [
        {
          type: "numeric",
          id: "numberOfBins",
          min: 3,
          max: 11,
          value: this.tableStyle.colorTraits.numberOfBins,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "numberOfBins",
              value
            );
            if (this.tableStyle.tableColorMap.binMaximums.length !== value) {
              const binMaximums = [
                ...this.tableStyle.tableColorMap.binMaximums
              ];
              // We have to reshape the binMaximums array - by either
              // - Shrinking it
              // - Expanding it - by copying the last element
              const newBinItems = binMaximums
                .slice(0, value)
                .concat(
                  value > binMaximums.length
                    ? new Array(value - binMaximums.length).fill(
                        binMaximums[binMaximums.length - 1]
                      )
                    : []
                );

              this.setBinMaximums(stratumId, newBinItems);
            }
          }
        }
      ]
    };
  }

  @computed get binMaximumsSelectableDims(): SelectableDimension {
    return {
      type: "group",
      id: "Bins",
      selectableDimensions: [
        {
          type: "numeric",
          id: "bin-min",
          max: this.tableStyle.tableColorMap.maximumValue,
          value: this.tableStyle.tableColorMap.minimumValue,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "minimumValue",
              value
            );
            this.setBinMaximums(stratumId);
          }
        },
        ...this.tableStyle.tableColorMap.binMaximums.map(
          (bin, idx) =>
            ({
              type: "numeric",
              id: `bin-${idx}`,
              value: bin,
              setDimensionValue: (stratumId, value) => {
                const binMaximums = [
                  ...this.tableStyle.tableColorMap.binMaximums
                ];
                if (isDefined(idx) && isDefined(value))
                  binMaximums[idx] = value;
                this.setBinMaximums(stratumId, binMaximums);
              }
            } as SelectableDimensionNumeric)
        )
      ]
    };
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    return filterOutUndefined([
      this.colorSchemeSelectableDim,

      // If we are in continuous realm:
      // - Display range
      this.colorSchemeType === "sequential-continuous" ||
      this.colorSchemeType === "diverging-continuous"
        ? this.displayRangeSelectableDim
        : undefined,
      // If we are in discrete realm:
      // - Number of bins
      // - Bin maximums
      ...(this.colorSchemeType === "sequential-discrete" ||
      this.colorSchemeType === "diverging-discrete"
        ? [this.numberOfBinsSelectableDim, this.binMaximumsSelectableDims]
        : [])
    ]);
  }

  /**
   * Set `TableColorStyleTraits.binMaximums`
   *
   * If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically (See `TableColorStyleTraits.binMaximums`)
   *
   * Because of this, we may need to update `maximumValue` so we don't get more bins added automatically
   */
  setBinMaximums(stratumId: string, binMaximums?: number[]) {
    if (!binMaximums)
      binMaximums = [...this.tableStyle.tableColorMap.binMaximums];
    const colorTraits = this.getTableStyleTraits(stratumId)?.color;
    if (
      binMaximums[binMaximums.length - 1] !==
      this.tableStyle.tableColorMap.maximumValue
    ) {
      colorTraits?.setTrait(
        stratumId,
        "maximumValue",
        binMaximums[binMaximums.length - 1]
      );
    }
    colorTraits?.setTrait(stratumId, "binMaximums", binMaximums);
  }

  /** Clear binMaximums (which will automatically generate new ones based on numberOfBins, minimumValue and maximumValue.
   * Then set them have a sensible precision (otherwise there will be way too many digits) */
  clearBinMaximums(stratumId: string) {
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      undefined
    );
    const binMaximums = this.tableStyle.tableColorMap.binMaximums.map(bin =>
      parseFloat(
        bin.toFixed(this.tableStyle.numberFormatOptions?.maximumFractionDigits)
      )
    );
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      binMaximums
    );
  }
}
