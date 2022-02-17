import {
  action,
  computed,
  IReactionDisposer,
  observable,
  reaction,
  runInAction
} from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import ContinuousColorMap from "../../Map/ColorMap/ContinuousColorMap";
import DiscreteColorMap from "../../Map/ColorMap/DiscreteColorMap";
import EnumColorMap from "../../Map/ColorMap/EnumColorMap";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import Icon from "../../Styled/Icon";
import { ColorStyleLegend } from "../../Table/TableAutomaticStylesStratum";
import {
  DEFAULT_DIVERGING,
  DEFAULT_QUALITATIVE,
  DEFAULT_SEQUENTIAL,
  DIVERGING_SCALES,
  QUALITATIVE_SCALES,
  SEQUENTIAL_CONTINUOUS_SCALES,
  SEQUENTIAL_SCALES
} from "../../Table/TableColorMap";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../../Traits/TraitsClasses/TableColorStyleTraits";
import CommonStrata from "../Definition/CommonStrata";
import createStratumInstance from "../Definition/createStratumInstance";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import {
  SelectableDimensionGroup,
  SelectableDimensionNumeric,
  SelectableDimensionWorkflowGroup
} from "./SelectableDimensions";
import SelectableDimensionWorkflow from "./SelectableDimensionWorkflow";

type ColorSchemeType =
  | "sequential-continuous"
  | "sequential-discrete"
  | "diverging-continuous"
  | "diverging-discrete"
  | "custom-discrete"
  | "qualitative"
  | "custom-qualitative";

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

  @computed get tableStyleSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Data",
      selectableDimensions: [
        {
          type: "select",
          id: "table-style",
          selectedId: this.tableStyle.id,
          options: this.item.tableColumns
            // Filter out empty columns
            .filter(col => col.uniqueValues.values.length > 0)
            .map(col => ({
              id: col.name,
              name: col.title
            })),
          setDimensionValue: action((stratumId, value) => {
            // If no TableStyle exists for the select Column, we need to create one and set some default values
            if (!this.item.styles.find(style => style.id === value)) {
              const column = this.item.tableColumns.find(
                col => col.name === value
              );
              if (!column) return;
              const styleTraits = this.getTableStyleTraits(stratumId, value);

              if (!styleTraits) return;

              styleTraits?.setTrait(
                stratumId,
                "color",
                createStratumInstance(TableColorStyleTraits, {
                  colorColumn: value,
                  legend: new ColorStyleLegend(this.item, column.columnNumber)
                })
              );
            }

            this.item.setTrait(stratumId, "activeStyle", value);
            // Note - the activeStyle reaction in TableStylingWorkflow.constructor handles all side effects
            // The reaction will call this.setColorSchemeTypeFromPalette()
          })
        }
      ]
    };
  }

  /** This will look at the current `colorMap` and `colorPalette` to guess which `colorSchemeType` is active.
   * This is because `TableMixin` doesn't have an explicit `"colorSchemeType"` flag - it will choose the appropriate type based on `TableStyleTraits`
   * `colorTraits.colorPalette` is also set here if we are only using `tableColorMap.defaultColorPaletteName`
   */
  @action
  setColorSchemeTypeFromPalette(): void {
    const colorMap = this.tableStyle.colorMap;
    const colorPalette = this.tableStyle.colorTraits.colorPalette;
    const defaultColorPalette = this.tableStyle.tableColorMap
      .defaultColorPaletteName;

    const colorPaletteWithDefault = colorPalette ?? defaultColorPalette;

    this.colorSchemeType = undefined;

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
        if (
          this.tableStyle.colorTraits.binColors &&
          this.tableStyle.colorTraits.binColors.length > 0
        ) {
          this.colorSchemeType = "custom-discrete";
        } else if (SEQUENTIAL_SCALES.includes(colorPaletteWithDefault)) {
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
      if (
        this.tableStyle.colorTraits.enumColors &&
        this.tableStyle.colorTraits.enumColors.length > 0
      ) {
        this.colorSchemeType = "custom-qualitative";
      } else {
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

  @computed get colorSchemeSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Color scheme",
      selectableDimensions: filterOutUndefined([
        {
          type: "select",
          id: "Type",
          name: "Type",
          undefinedLabel: "Please specify",
          options: filterOutUndefined([
            { id: "sequential-continuous", name: "Sequential (continuous)" },
            { id: "sequential-discrete", name: "Sequential (discrete)" },
            { id: "diverging-continuous", name: "Divergent (continuous)" },
            { id: "diverging-discrete", name: "Divergent (discrete)" },
            { id: "qualitative", name: "Qualitative" },
            // Add options for "custom" color palettes if we are in "custom-qualitative" or "custom-discrete" mode
            this.colorSchemeType === "custom-qualitative"
              ? { id: "custom-qualitative", name: "Custom (qualitative)" }
              : undefined,
            this.colorSchemeType === "custom-discrete"
              ? { id: "custom-discrete", name: "Custom (discrete)" }
              : undefined
          ]),
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
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "binColors",
                  undefined
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
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "binColors",
                  undefined
                );
              } else if (id === "qualitative") {
                this.colorSchemeType = id;
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  "enum"
                );
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "enumColors",
                  undefined
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
        // Hide Color scheme selector if we have custom color
        this.colorSchemeType &&
        this.colorSchemeType !== "custom-discrete" &&
        this.colorSchemeType !== "custom-qualitative"
          ? {
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
          : undefined,
        // Show "Number of Bins" if in discrete mode
        this.colorSchemeType === "sequential-discrete" ||
        this.colorSchemeType === "diverging-discrete" ||
        this.colorSchemeType === "custom-discrete"
          ? {
              type: "numeric",
              id: "numberOfBins",
              name: "Number of Bins",
              min: 3,
              max: 11,
              value: this.tableStyle.colorTraits.numberOfBins,
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "numberOfBins",
                  value
                );
                if (
                  this.tableStyle.tableColorMap.binMaximums.length !== value
                ) {
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
          : undefined
      ])
    };
  }

  @computed get minimumValueSelectableDim(): SelectableDimensionNumeric {
    return {
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
        if (
          this.colorSchemeType === "sequential-discrete" ||
          this.colorSchemeType === "diverging-discrete" ||
          this.colorSchemeType === "custom-discrete"
        ) {
          this.setBinMaximums(stratumId);
        }
      }
    };
  }

  @computed get displayRangeSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Display range",
      selectableDimensions: [
        this.minimumValueSelectableDim,
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

  @observable
  private openBinIndex: number | undefined;

  /** Group to show bins with color, start/stop numbers.
   * Here we use SelectableDimensionGroup.onToggle and SelectableDimensionGroup.isOpen to make this group act like an accordion - so only one bin can be edited at any given time.
   *
   */
  @computed get binMaximumsSelectableDims(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Bins",
      selectableDimensions: [
        ...this.tableStyle.tableColorMap.binMaximums
          .map(
            (bin, idx) =>
              ({
                type: "group",
                id: `bin-${idx}-start`,
                name: `<div><div style="margin-bottom: -4px; width:20px; height:20px; display:inline-block; background-color:${this
                  .tableStyle.tableColorMap.binColors[idx] ??
                  "#aaa"} ;"></div> ${
                  idx === 0
                    ? this.minimumValueSelectableDim.value
                    : this.tableStyle.tableColorMap.binMaximums[idx - 1]
                } to ${bin}</div>`,
                isOpen: this.openBinIndex === idx,
                onToggle: open => {
                  if (open && this.openBinIndex !== idx) {
                    runInAction(() => (this.openBinIndex = idx));
                    return true;
                  }
                },
                selectableDimensions: [
                  {
                    type: "color",
                    id: `bin-${idx}-col`,
                    name: `Color`,
                    value: this.tableStyle.tableColorMap.binColors[idx],
                    setDimensionValue: (stratumId, value) => {
                      const binColors = [
                        ...this.tableStyle.tableColorMap.binColors
                      ];
                      if (isDefined(value)) binColors[idx] = value;
                      this.getTableStyleTraits(stratumId)?.color.setTrait(
                        stratumId,
                        "binColors",
                        binColors
                      );
                      runInAction(
                        () => (this.colorSchemeType = "custom-discrete")
                      );
                    }
                  },
                  idx === 0
                    ? this.minimumValueSelectableDim
                    : {
                        type: "numeric",
                        id: `bin-${idx}-start`,
                        name: "Start",
                        value: this.tableStyle.tableColorMap.binMaximums[
                          idx - 1
                        ],
                        setDimensionValue: (stratumId, value) => {
                          const binMaximums = [
                            ...this.tableStyle.tableColorMap.binMaximums
                          ];
                          if (isDefined(value)) binMaximums[idx - 1] = value;
                          this.setBinMaximums(stratumId, binMaximums);
                        }
                      },
                  {
                    type: "numeric",
                    id: `bin-${idx}-stop`,
                    name: "Stop",
                    value: bin,
                    setDimensionValue: (stratumId, value) => {
                      const binMaximums = [
                        ...this.tableStyle.tableColorMap.binMaximums
                      ];
                      if (isDefined(value)) binMaximums[idx] = value;
                      this.setBinMaximums(stratumId, binMaximums);
                    }
                  }
                ]
              } as SelectableDimensionGroup)
          )
          .reverse() // Reverse array of bins to match Legend (descending order)
      ]
    };
  }

  @computed get enumColorsSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Colors",
      selectableDimensions: filterOutUndefined([
        ...this.tableStyle.tableColorMap.enumColors.map((enumCol, idx) => {
          if (!enumCol.value) return;
          const dims: SelectableDimensionGroup = {
            type: "group",
            id: `enum-${idx}-start`,
            name: `<div><div style="margin-bottom: -4px; width:20px; height:20px; display:inline-block; background-color:${enumCol.color ??
              "#aaa"} ;"></div> ${enumCol.value}</div>`,
            isOpen: this.openBinIndex === idx,
            onToggle: open => {
              if (open && this.openBinIndex !== idx) {
                runInAction(() => (this.openBinIndex = idx));
                return true;
              }
            },
            selectableDimensions: [
              {
                type: "color",
                id: `enum-${idx}-col`,
                name: `Color`,
                value: enumCol.color,
                setDimensionValue: action((stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, enumCol.value, value);
                })
              },
              {
                type: "select",
                id: `enum-${idx}-value`,
                name: "Value",
                selectedId: enumCol.value,
                // Find unique column values which don't already have an enumCol
                // We prepend the current enumCol.value
                options: [
                  { id: enumCol.value },
                  ...(this.tableStyle.colorColumn?.uniqueValues.values
                    ?.filter(
                      value =>
                        !this.tableStyle.tableColorMap.enumColors.find(
                          enumCol => enumCol.value === value
                        )
                    )
                    .map(id => ({ id })) ?? [])
                ],
                setDimensionValue: action((stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, value, enumCol.color);
                })
              },
              {
                type: "button",
                id: `enum-${idx}-remove`,
                value: "Remove",
                setDimensionValue: action(stratumId => {
                  this.colorSchemeType = "custom-qualitative";
                  // Remove element by clearing `value`
                  this.setEnumColorTrait(stratumId, idx, undefined, undefined);
                  this.openBinIndex = undefined;
                })
              }
            ]
          };
          return dims;
        }),

        // Are there more colors to add (are there more unique values in the column than enumCols)
        // Create "Add" to user can add more
        this.tableStyle.colorColumn &&
        this.tableStyle.tableColorMap.enumColors.filter(col => col.value)
          .length < this.tableStyle.colorColumn?.uniqueValues.values.length
          ? {
              type: "button",
              id: `enum-add`,
              value: "Add",
              setDimensionValue: action(stratumId => {
                this.colorSchemeType = "custom-qualitative";
                const firstValue = this.tableStyle.colorColumn?.uniqueValues.values.find(
                  value =>
                    !this.tableStyle.tableColorMap.enumColors.find(
                      col => col.value === value
                    )
                );
                if (!isDefined(firstValue)) return;

                // Can we find any unused colors in the colorPalette
                const unusedColor = this.tableStyle.tableColorMap
                  .colorScaleCategorical(
                    this.tableStyle.tableColorMap.enumColors.length + 1
                  )
                  .find(
                    col =>
                      !this.tableStyle.tableColorMap.enumColors.find(
                        enumColor => enumColor.color === col
                      )
                  );

                this.setEnumColorTrait(
                  stratumId,
                  this.tableStyle.tableColorMap.enumColors.length,
                  firstValue,
                  unusedColor ?? "#000000"
                );

                this.openBinIndex =
                  this.tableStyle.tableColorMap.enumColors.length - 1;
              })
            }
          : undefined
      ])
    };
  }

  @computed get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      this.tableStyleSelectableDim,
      this.colorSchemeSelectableDim,

      // If we are in continuous realm:
      // - Display range
      this.colorSchemeType === "sequential-continuous" ||
      this.colorSchemeType === "diverging-continuous"
        ? this.displayRangeSelectableDim
        : undefined,
      // If we are in discrete realm:
      // - Bin maximums
      this.colorSchemeType === "sequential-discrete" ||
      this.colorSchemeType === "diverging-discrete" ||
      this.colorSchemeType === "custom-discrete"
        ? this.binMaximumsSelectableDims
        : undefined,
      // If we are in qualitative realm
      this.colorSchemeType === "qualitative" ||
      this.colorSchemeType === "custom-qualitative"
        ? this.enumColorsSelectableDim
        : undefined
    ]);
  }

  /**
   * Set `TableColorStyleTraits.binMaximums`
   *
   * If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically (See `TableColorStyleTraits.binMaximums`)
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

  /** Get `TableStyleTraits` for the active table style (so we can call `setTraits`) */
  getTableStyleTraits(stratumId: string, id: string = this.tableStyle.id) {
    return (
      this.item.styles?.find(style => style.id === id) ??
      this.item.addObject(stratumId, "styles", id)
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

  setEnumColorTrait(
    stratumId: string,
    index: number,
    value?: string,
    color?: string
  ) {
    const enumColors = this.tableStyle.colorTraits.traits.enumColors.toJson(
      this.tableStyle.tableColorMap.enumColors
    ) as ModelPropertiesFromTraits<EnumColorTraits>[];

    // Remove element if value and color are undefined
    if (!isDefined(value) && !isDefined(color)) enumColors.splice(index, 1);
    else enumColors[index] = { value, color };

    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "enumColors",
      enumColors
    );
  }
}
