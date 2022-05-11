import {
  action,
  computed,
  IReactionDisposer,
  observable,
  ObservableMap,
  reaction,
  runInAction
} from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import ConstantColorMap from "../../Map/ColorMap/ConstantColorMap";
import ContinuousColorMap from "../../Map/ColorMap/ContinuousColorMap";
import DiscreteColorMap from "../../Map/ColorMap/DiscreteColorMap";
import EnumColorMap from "../../Map/ColorMap/EnumColorMap";
import { allIcons, getMakiIcon } from "../../Map/Icons/Maki/MakiIcons";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import {
  QualitativeColorSchemeOptionRenderer,
  QuantitativeColorSchemeOptionRenderer
} from "../../ReactViews/SelectableDimensions/ColorSchemeOptionRenderer";
import { MarkerOptionRenderer } from "../../ReactViews/SelectableDimensions/MarkerOptionRenderer";
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
import TableColumn from "../../Table/TableColumn";
import TableColumnType from "../../Table/TableColumnType";
import TableStyleMap from "../../Table/TableStyleMap";
import { EnumColorTraits } from "../../Traits/TraitsClasses/TableColorStyleTraits";
import { OutlineSymbolTraits } from "../../Traits/TraitsClasses/TableOutlineStyleTraits";
import {
  BinStyleTraits,
  EnumStyleTraits,
  PointSymbolTraits,
  TableStyleMapTraits
} from "../../Traits/TraitsClasses/TablePointStyleTraits";
import CommonStrata from "../Definition/CommonStrata";
import Model from "../Definition/Model";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import {
  FlatSelectableDimension,
  SelectableDimension,
  SelectableDimensionButton,
  SelectableDimensionColor,
  SelectableDimensionGroup,
  SelectableDimensionNumeric,
  SelectableDimensionText
} from "../SelectableDimensions/SelectableDimensions";
import ViewingControls from "../ViewingControls";
import SelectableDimensionWorkflow, {
  SelectableDimensionWorkflowGroup
} from "../Workflows/SelectableDimensionWorkflow";

/** The ColorSchemeType is used to change which SelectableDimensions are shown.
 * It is basically the "mode" of the TableStylingWorkflow
 *
 * For example - if we are using "sequential-continuous" - then the dimensions will be shown to configure the following:
 * - Sequential color scales
 * - Minimum/Maximum values
 */
type ColorSchemeType =
  | "no-style"
  | "sequential-continuous"
  | "sequential-discrete"
  | "diverging-continuous"
  | "diverging-discrete"
  | "custom-discrete"
  | "qualitative"
  | "custom-qualitative";

type StyleType = "fill" | "point-size" | "point" | "outline";

/** Columns/Styles with the following TableColumnTypes will be hidden unless we are showing "advanced" options */
export const ADVANCED_TABLE_COLUMN_TYPES = [
  TableColumnType.latitude,
  TableColumnType.longitude,
  TableColumnType.region,
  TableColumnType.time
];

/** SelectableDimensionWorkflow to set styling options for TableMixin models */
export default class TableStylingWorkflow
  implements SelectableDimensionWorkflow {
  static type = "table-styling";

  /** This is used to simplify SelectableDimensions available to the user.
   * For example - if equal to `diverging-continuous` - then only Diverging continuous color scales will be presented as options
   * See setColorSchemeTypeFromPalette and setColorSchemeType for how this is set. */
  @observable colorSchemeType: ColorSchemeType | undefined;
  @observable styleType: StyleType = "fill";

  /** Which bin is currently open in `binMaximumsSelectableDims` or `enumColorsSelectableDim`.
   * This is used in `SelectableDimensionGroup.onToggle` and `SelectableDimensionGroup.isOpen` to make the groups act like an accordion - so only one bin can be edited at any given time.
   */
  @observable
  private readonly openBinIndex = new ObservableMap<
    StyleType,
    number | undefined
  >();

  private activeStyleDisposer: IReactionDisposer;

  constructor(readonly item: TableMixin.Instance) {
    // We need to reset colorSchemeType every time Table.activeStyle changes
    this.activeStyleDisposer = reaction(
      () => this.item.activeStyle,
      () => {
        // If the active style is of "advanced" TableColumnType, then set colorSchemeType to "no-style"
        if (
          isDefined(this.item.activeTableStyle.colorColumn) &&
          ADVANCED_TABLE_COLUMN_TYPES.includes(
            this.item.activeTableStyle.colorColumn.type
          )
        ) {
          runInAction(() => (this.colorSchemeType = "no-style"));
        } else {
          this.setColorSchemeTypeFromPalette();
        }
      }
    );
    this.setColorSchemeTypeFromPalette();
  }

  onClose() {
    this.activeStyleDisposer();
  }

  @computed
  get menu() {
    return {
      options: filterOutUndefined([
        {
          text: `${
            this.showAdvancedOptions ? "Hide" : "Show"
          } advanced options`,
          onSelect: action(() => {
            this.showAdvancedOptions = !this.showAdvancedOptions;
          })
        },
        this.showAdvancedOptions
          ? {
              text: "Copy user stratum to clipboard",
              onSelect: () => {
                navigator.clipboard.writeText(
                  JSON.stringify(this.item.strata.get(CommonStrata.user))
                );
              },
              disable: !this.showAdvancedOptions
            }
          : undefined
      ])
    };
  }

  get name() {
    return `Style`;
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  get footer() {
    return {
      buttonText: "Reset to default style",
      /** Delete all user strata values for TableColumnTraits and TableStyleTraits for the current activeStyle */
      onClick: action(() => {
        this.getTableColumnTraits(CommonStrata.user)?.strata.delete(
          CommonStrata.user
        );
        this.getTableStyleTraits(CommonStrata.user)?.strata.delete(
          CommonStrata.user
        );
        this.setColorSchemeTypeFromPalette();
      })
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

    if (colorMap instanceof ConstantColorMap) {
      this.colorSchemeType = "no-style";
    } else if (colorMap instanceof ContinuousColorMap) {
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
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_DIVERGING
          );
        }
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
          if (!colorPalette) {
            this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
              CommonStrata.user,
              "colorPalette",
              DEFAULT_DIVERGING
            );
          }
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

  /** Handle change on colorType - this is called by the  */
  @action setColorSchemeType(stratumId: string, id: string | undefined) {
    if (!id) return;
    // Set `activeStyle` trait so the value doesn't change
    this.item.setTrait(stratumId, "activeStyle", this.tableStyle.id);

    // Hide any open bin
    this.openBinIndex.clear();

    // Here we use item.activeTableStyle.colorTraits.colorPalette instead of this.colorPalette because we only want this to be defined, if the trait is defined - we don't care about defaultColorPaletteName
    const colorPalette = this.tableStyle.colorTraits.colorPalette;

    // **Discrete color maps**
    // Reset bins
    if (id === "sequential-discrete" || id === "diverging-discrete") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "bin"
      );
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "binColors",
        []
      );

      // Set numberOfBins according to limits of sequential and diverging color scales:
      // - Sequential is [3,9]
      // - Diverging is [3,11]

      // If numberOfBins is 0 - set to sensible default (7)
      if (this.tableStyle.colorTraits.numberOfBins === 0) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          7
        );
      } else if (
        id === "sequential-discrete" &&
        this.tableStyle.tableColorMap.binColors.length > 9
      ) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          9
        );
      } else if (
        id === "diverging-discrete" &&
        this.tableStyle.tableColorMap.binColors.length > 11
      ) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          11
        );
      } else if (this.tableStyle.tableColorMap.binColors.length < 3) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          3
        );
      }
    }
    // **Continuous color maps**
    else if (id === "sequential-continuous" || id === "diverging-continuous") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "continuous"
      );
    }
    // **Qualitative (enum) color maps**
    else if (id === "qualitative") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "enum"
      );
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "enumColors",
        []
      );
    }

    // **No style (constant) color maps**
    else if (id === "no-style") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "constant"
      );
    }

    // If the current colorPalette is incompatible with the selected type - change colorPalette to default for the selected type
    if (
      id === "sequential-continuous" &&
      (!colorPalette ||
        ![...SEQUENTIAL_SCALES, ...SEQUENTIAL_CONTINUOUS_SCALES].includes(
          colorPalette
        ))
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
      (id === "diverging-continuous" || id === "diverging-discrete") &&
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
  }

  /** Show advances options
   * - Show all column types in "Data" select
   * - Show "Data type (advanced)" select. This allow user to change column type */
  @observable showAdvancedOptions: boolean = false;

  @computed get datasetSelectableDim(): SelectableDimension {
    return {
      type: "select",
      id: "dataset",
      name: "Dataset",
      selectedId: this.item.uniqueId,

      // Find all workbench items which have TableStylingWorkflow
      options: this.item.terria.workbench.items
        .filter(
          item =>
            ViewingControls.is(item) &&
            item.viewingControls.find(
              control => control.id === TableStylingWorkflow.type
            )
        )
        .map(item => ({
          id: item.uniqueId,
          name: getName(item)
        })),
      setDimensionValue: (stratumId, value) => {
        const item = this.item.terria.workbench.items.find(
          i => i.uniqueId === value
        );
        if (item && TableMixin.isMixedInto(item)) {
          // Trigger new TableStylingWorkflow
          if (
            item.viewingControls.find(
              control => control.id === TableStylingWorkflow.type
            )
          ) {
            item.terria.selectableDimensionWorkflow = new TableStylingWorkflow(
              item
            );
          }
        }
      }
    };
  }

  /** Table Style dimensions:
   * - Dataset (Table models in workbench)
   * - Variable (Table style in model)
   * - TableColumn type (advanced only)
   */
  @computed get tableStyleSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Data",
      selectableDimensions: this.showAdvancedOptions
        ? [
            this.datasetSelectableDim,
            {
              type: "select",
              id: "table-style-id",
              name: "Style",
              selectedId: this.tableStyle.id,
              options: this.item.tableStyles.map(style => ({
                id: style.id,
                name: style.title
              })),
              setDimensionValue: (stratumId, value) => {
                this.item.setTrait(stratumId, "activeStyle", value);
                // Note - the activeStyle reaction in TableStylingWorkflow.constructor handles all side effects
                // The reaction will call this.setColorSchemeTypeFromPalette()
              }
            },
            {
              type: "select",
              id: "table-color-col",
              name: "Color column",
              selectedId: this.tableStyle.colorColumn?.name,
              options: this.item.tableColumns.map(col => ({
                id: col.name,
                name: col.title
              })),
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorColumn",
                  value
                );
              }
            },
            {
              type: "select",
              id: "data-type",
              name: "Color column type (advanced)",
              options: Object.keys(TableColumnType)
                .filter(type => type.length > 1)
                .map(colType => ({ id: colType })),
              selectedId: isDefined(this.tableStyle.colorColumn?.type)
                ? TableColumnType[this.tableStyle.colorColumn!.type]
                : undefined,
              setDimensionValue: (stratumId, id) => {
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  id
                );
                this.setColorSchemeTypeFromPalette();
              }
            }
          ]
        : [
            this.datasetSelectableDim,

            {
              type: "select",
              id: "table-style",
              name: "Style",
              selectedId: this.tableStyle.id,
              options: this.item.tableColumns
                // Filter out empty columns
                .filter(
                  col =>
                    col.uniqueValues.values.length > 0 &&
                    !ADVANCED_TABLE_COLUMN_TYPES.includes(col.type)
                )
                .map(col => ({
                  id: col.name,
                  name: col.title
                })),
              setDimensionValue: (stratumId, value) => {
                this.item.setTrait(stratumId, "activeStyle", value);
                // Note - the activeStyle reaction in TableStylingWorkflow.constructor handles all side effects
                // The reaction will call this.setColorSchemeTypeFromPalette()
              }
            },
            {
              type: "select",
              id: "table-style-type",
              name: "Symbolisation",
              selectedId: this.styleType,
              options: [
                { id: "fill" },
                { id: "point-size" },
                { id: "point" },
                { id: "outline" }
              ],
              setDimensionValue: (stratumId, value) => {
                if (
                  value === "fill" ||
                  value === "point-size" ||
                  value === "point" ||
                  value === "outline"
                )
                  this.styleType = value;
              }
            }
          ]
    };
  }

  /** List of color schemes available for given `colorSchemeType` */
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

  /** Color scheme dimensions:
   * - Type (see `this.colorSchemeType`)
   * - Color scheme (see `this.colorSchemesForType`)
   * - Number of bins (for discrete)
   */
  @computed get colorSchemeSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Fill Color",
      selectableDimensions: filterOutUndefined([
        this.tableStyle.colorColumn
          ? {
              type: "select",
              id: "Type",
              name: "Type",
              undefinedLabel: "Please specify",
              options: filterOutUndefined([
                { id: "no-style", name: "No style" },
                ...(this.tableStyle.colorColumn.type === TableColumnType.scalar
                  ? [
                      {
                        id: "sequential-continuous",
                        name: "Sequential (continuous)"
                      },
                      {
                        id: "sequential-discrete",
                        name: "Sequential (discrete)"
                      },
                      {
                        id: "diverging-continuous",
                        name: "Divergent (continuous)"
                      },
                      { id: "diverging-discrete", name: "Divergent (discrete)" }
                    ]
                  : []),
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
                this.setColorSchemeType(stratumId, id);
              }
            }
          : undefined,

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
          optionRenderer:
            this.colorSchemeType === "qualitative"
              ? QualitativeColorSchemeOptionRenderer
              : QuantitativeColorSchemeOptionRenderer(
                  this.colorSchemeType === "sequential-discrete" ||
                    this.colorSchemeType === "diverging-discrete"
                    ? this.tableStyle.tableColorMap.binColors.length
                    : undefined
                ),
          setDimensionValue: (stratumId, id) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "colorPalette",
              id
            );
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "binColors",
              []
            );
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "enumColors",
              []
            );
          }
        },
        // Show "Number of Bins" if in discrete mode
        this.colorSchemeType === "sequential-discrete" ||
        this.colorSchemeType === "diverging-discrete"
          ? {
              type: "numeric",
              id: "numberOfBins",
              name: "Number of Bins",
              allowUndefined: true,
              min:
                // Sequential and diverging color scales must have at least 3 bins
                this.colorSchemeType === "sequential-discrete" ||
                this.colorSchemeType === "diverging-discrete"
                  ? 3
                  : // Custom color scales only need at least 1
                    1,
              max:
                // Sequential discrete color scales support up to 9 bins
                this.colorSchemeType === "sequential-discrete"
                  ? 9
                  : // Diverging discrete color scales support up to 11 bins
                  this.colorSchemeType === "diverging-discrete"
                  ? 11
                  : // Custom discrete color scales can be any number of bins
                    undefined,
              value: this.tableStyle.colorTraits.numberOfBins,
              setDimensionValue: (stratumId, value) => {
                if (!isDefined(value)) return;
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "numberOfBins",
                  value
                );

                this.clearBinMaximums(stratumId);
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

  /** Display range dimensions:
   * - Minimum value
   * - Maximum value
   */
  @computed get displayRangeDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Display range",
      isOpen: false,
      selectableDimensions: filterOutUndefined([
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
        },
        this.item.outlierFilterDimension
      ])
    };
  }

  /** Group to show bins with color, start/stop numbers.
   */
  @computed get binColorDims(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Bins",
      isOpen: false,
      selectableDimensions: [
        ...this.tableStyle.tableColorMap.binMaximums
          .map(
            (bin, idx) =>
              ({
                type: "group",
                id: `bin-${idx}-start`,
                name: getColorPreview(
                  this.tableStyle.tableColorMap.binColors[idx] ?? "#aaa",
                  `${
                    idx === 0
                      ? this.minimumValueSelectableDim.value
                      : this.tableStyle.tableColorMap.binMaximums[idx - 1]
                  } to ${bin}`
                ),
                isOpen: this.openBinIndex.get("fill") === idx,
                onToggle: open => {
                  if (open && this.openBinIndex.get("fill") !== idx) {
                    runInAction(() => this.openBinIndex.set("fill", idx));
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
                      this.colorSchemeType = "custom-discrete";
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

  /** Groups to show enum "bins" with colors and value */
  @computed get enumColorDims(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Colors",
      isOpen: false,
      selectableDimensions: filterOutUndefined([
        ...this.tableStyle.tableColorMap.enumColors.map((enumCol, idx) => {
          if (!enumCol.value) return;
          const dims: SelectableDimensionGroup = {
            type: "group",
            id: `enum-${idx}-start`,
            name: getColorPreview(enumCol.color ?? "#aaa", enumCol.value),
            isOpen: this.openBinIndex.get("fill") === idx,
            onToggle: open => {
              if (open && this.openBinIndex.get("fill") !== idx) {
                runInAction(() => this.openBinIndex.set("fill", idx));
                return true;
              }
            },
            selectableDimensions: [
              {
                type: "color",
                id: `enum-${idx}-col`,
                name: `Color`,
                value: enumCol.color,
                setDimensionValue: (stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, enumCol.value, value);
                }
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
                setDimensionValue: (stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, value, enumCol.color);
                }
              },
              {
                type: "button",
                id: `enum-${idx}-remove`,
                value: "Remove",
                setDimensionValue: stratumId => {
                  this.colorSchemeType = "custom-qualitative";
                  // Remove element by clearing `value`
                  this.setEnumColorTrait(stratumId, idx, undefined, undefined);
                }
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
              value: "Add Color",
              setDimensionValue: stratumId => {
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

                this.openBinIndex.set(
                  "fill",
                  this.tableStyle.tableColorMap.enumColors.length - 1
                );
              }
            }
          : undefined
      ])
    };
  }

  @computed get nullColorDimension(): SelectableDimensionColor {
    return {
      type: "color",
      id: `null-col`,
      name: `Default color`,
      value: this.tableStyle.colorTraits.nullColor,
      allowUndefined: true,
      setDimensionValue: (stratumId, value) => {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "nullColor",
          value
        );
      }
    };
  }

  @computed get outlierColorDimension(): SelectableDimensionColor {
    return {
      type: "color",
      id: `outlier-col`,
      name: `Outlier color`,
      allowUndefined: true,
      value:
        this.tableStyle.colorTraits.outlierColor ??
        this.tableStyle.tableColorMap.outlierColor?.toCssHexString(),
      setDimensionValue: (stratumId, value) => {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "outlierColor",
          value
        );
      }
    };
  }

  /** Misc table style color dimensions:
   * - Region color
   * - Null color
   * - Outlier color
   */
  @computed get additionalColorDimensions(): SelectableDimensionGroup {
    return {
      type: "group",
      id: "Additional colors",
      // Open group by default is no activeStyle is selected
      isOpen: !this.item.activeStyle || this.colorSchemeType === "no-style",
      selectableDimensions: filterOutUndefined([
        this.tableStyle.colorColumn?.type === TableColumnType.region
          ? {
              type: "color",
              id: `region-col`,
              name: `Region color`,
              value: this.tableStyle.colorTraits.regionColor,
              allowUndefined: true,
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "regionColor",
                  value
                );
              }
            }
          : {
              type: "color",
              id: `null-col`,
              name: `Default color`,
              value: this.tableStyle.colorTraits.nullColor,
              allowUndefined: true,
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "nullColor",
                  value
                );
              }
            },
        this.tableStyle.colorColumn?.type === TableColumnType.scalar
          ? {
              type: "color",
              id: `outlier-col`,
              name: `Outlier color`,
              allowUndefined: true,
              value:
                this.tableStyle.colorTraits.outlierColor ??
                this.tableStyle.tableColorMap.outlierColor?.toCssHexString(),
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "outlierColor",
                  value
                );
              }
            }
          : undefined
      ])
    };
  }

  @computed get pointSizeDimensions(): SelectableDimensionGroup {
    return {
      type: "group",
      id: "Point size",
      isOpen: true,
      selectableDimensions: [
        {
          type: "select",
          id: `point-size-column`,
          name: `Variable`,
          selectedId: this.tableStyle.pointSizeTraits.pointSizeColumn,
          options: this.item.tableColumns
            .filter(col => col.type === TableColumnType.scalar)
            .map(col => ({
              id: col.name,
              name: col.title
            })),
          allowUndefined: true,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
              stratumId,
              "pointSizeColumn",
              value
            );
          }
        },
        ...((this.tableStyle.pointSizeColumn
          ? [
              {
                type: "numeric",
                id: "point-size-null",
                name: "Default size",
                min: 0,
                value: this.tableStyle.pointSizeTraits.nullSize,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "nullSize",
                    value
                  );
                }
              },
              {
                type: "numeric",
                id: "point-sizes-factor",
                name: "Size factor",
                min: 0,
                value: this.tableStyle.pointSizeTraits.sizeFactor,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "sizeFactor",
                    value
                  );
                }
              },
              {
                type: "numeric",
                id: "point-size-offset",
                name: "Size offset",
                min: 0,
                value: this.tableStyle.pointSizeTraits.sizeOffset,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "sizeOffset",
                    value
                  );
                }
              }
            ]
          : []) as SelectableDimensionNumeric[])
      ]
    };
  }

  /** Advanced region mapping - pulled from TableMixin.regionColumnDimensions and TableMixin.regionProviderDimensions
   */
  @computed
  get advancedRegionMappingDimensions(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Region mapping",
      isOpen: false,
      selectableDimensions: filterOutUndefined([
        this.item.regionColumnDimensions,
        this.item.regionProviderDimensions
      ])
    };
  }

  /** Advanced table dimensions:
   * - Legend title
   * - Legend ticks
   * - Legend item titles
   * - Show disable style option
   * - Show disable time option
   * - Enable manual region mapping
   * - Table Column Title
   * - Table Column Units
   */
  @computed
  get advancedTableDimensions(): SelectableDimensionWorkflowGroup[] {
    return [
      {
        type: "group",
        id: "Legend",
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "text",
            id: "legend-title",
            name: "Title",
            value: this.tableStyle.colorTraits.legend.title,
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.color.legend.setTrait(
                stratumId,
                "title",
                value
              );
            }
          },
          this.colorSchemeType === "diverging-continuous" ||
          this.colorSchemeType === "sequential-continuous"
            ? {
                type: "numeric",
                id: "legend-ticks",
                name: "Ticks",
                min: 2,
                value: this.tableStyle.colorTraits.legendTicks,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "legendTicks",
                    value
                  );
                }
              }
            : undefined,

          ...this.tableStyle.colorTraits.legend.items.map(
            (legendItem, idx) =>
              ({
                type: "text",
                id: `legend-${idx}-title`,
                name: `Item ${idx + 1} Title`,
                value: legendItem.title,
                setDimensionValue: (stratumId, value) => {
                  legendItem.setTrait(stratumId, "title", value);
                }
              } as SelectableDimensionText)
          )
        ])
      },
      {
        type: "group",
        id: "Table",
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "checkbox",
            id: "showDisableStyleOption",
            name: "Show disable style option",
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.showDisableStyleOption ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "showDisableStyleOption",
                value === "true"
              );
            }
          },
          {
            type: "checkbox",
            id: "showDisableTimeOption",
            name: "Show disable time option",
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.showDisableTimeOption ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "showDisableTimeOption",
                value === "true"
              );
            }
          },
          {
            type: "checkbox",
            id: "enableManualRegionMapping",
            name: "Enable manual region mapping",
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.enableManualRegionMapping ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "enableManualRegionMapping",
                value === "true"
              );
            }
          }
        ])
      },
      {
        type: "group",
        id: "Variable/column",
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "text",
            id: "column-title",
            name: "Title",
            value: this.tableStyle.colorColumn?.title,
            setDimensionValue: (stratumId, value) => {
              this.getTableColumnTraits(stratumId)?.setTrait(
                stratumId,
                "title",
                value
              );
            }
          },
          {
            type: "text",
            id: "column-units",
            name: "Units",
            value: this.tableStyle.colorColumn?.units,
            setDimensionValue: (stratumId, value) => {
              this.getTableColumnTraits(stratumId)?.setTrait(
                stratumId,
                "units",
                value
              );
            }
          }
        ])
      }
    ];
  }

  getStyleDims<
    T extends Model<
      {
        enum: EnumStyleTraits[];
        bin: BinStyleTraits[];
      } & TableStyleMapTraits
    >
  >(
    key: StyleType,
    traits: T,
    combinedTraits: T,
    column: TableColumn | undefined,
    tableStyleMap: TableStyleMap<unknown>,
    styleDims: {
      null: { dims: FlatSelectableDimension[]; label: string };
      bin: { dims: FlatSelectableDimension[]; label: string }[];
      enum: { dims: FlatSelectableDimension[]; label: string }[];
      addBinLabel: string;
      addEnumLabel: string;
    }
  ): SelectableDimensionWorkflowGroup[] {
    if (!isDefined(traits)) return [];
    return filterOutUndefined([
      {
        type: "group",
        id: "Marker Style",
        isOpen: true,
        selectableDimensions: filterOutUndefined([
          {
            type: "select",
            id: "table-style",
            name: "Variable",
            selectedId: column?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map(col => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              traits.setTrait(stratumId, "column", value);
            }
          },
          column
            ? {
                type: "select",
                id: "Type",
                name: "Type",
                undefinedLabel: "Please specify",
                options: filterOutUndefined([
                  { id: "constant", name: "No style" },
                  column.type === TableColumnType.scalar
                    ? { id: "bin", name: "Discrete" }
                    : undefined,
                  { id: "enum", name: "Qualitative" }
                ]),
                selectedId:
                  combinedTraits.mapType ?? tableStyleMap.styleMap.type,
                setDimensionValue: (stratumId, id) => {
                  if (id === "bin" || id === "enum" || id === "constant")
                    traits.setTrait(stratumId, "mapType", id);
                }
              }
            : undefined
        ])
      },

      column &&
      (combinedTraits.mapType ?? tableStyleMap.styleMap.type) === "enum"
        ? {
            type: "group",
            id: "Enum styles",
            isOpen: true,
            selectableDimensions: filterOutUndefined([
              ...traits.enum?.map((enumPoint, idx) => {
                const dims: SelectableDimensionGroup = {
                  type: "group",
                  id: `${key}-enum-${idx}`,
                  name: styleDims.enum[idx].label,
                  isOpen: this.openBinIndex.get(key) === idx,
                  onToggle: open => {
                    if (open && this.openBinIndex.get(key) !== idx) {
                      runInAction(() => this.openBinIndex.set(key, idx));
                      return true;
                    }
                  },
                  selectableDimensions: [
                    {
                      type: "select",
                      id: `${key}-enum-${idx}-value`,
                      name: "Value",
                      selectedId: enumPoint.value ?? undefined,
                      // Find unique column values which don't already have an enumCol
                      // We prepend the current enumCol.value
                      options: filterOutUndefined([
                        enumPoint.value ? { id: enumPoint.value } : undefined,
                        ...(column?.uniqueValues.values
                          ?.filter(
                            value =>
                              !combinedTraits.enum.find(
                                enumCol => enumCol.value === value
                              )
                          )
                          .map(id => ({ id })) ?? [])
                      ]),
                      setDimensionValue: (stratumId, value) => {
                        enumPoint.setTrait(stratumId, "value", value);
                      }
                    },
                    ...styleDims.enum[idx].dims,

                    {
                      type: "button",
                      id: `${key}-enum-${idx}-remove`,
                      value: "Remove",
                      setDimensionValue: stratumId => {
                        enumPoint.setTrait(stratumId, "value", null);
                      }
                    }
                  ]
                };
                return dims;
              }),
              // Are there more colors to add (are there more unique values in the column than enumCols)
              // Create "Add" to user can add more
              combinedTraits.enum?.filter(col => col.value).length <
              column?.uniqueValues.values.length
                ? ({
                    type: "button",
                    id: `${key}-enum-add`,
                    value: styleDims.addEnumLabel,
                    setDimensionValue: stratumId => {
                      const firstValue = column?.uniqueValues.values.find(
                        value =>
                          !combinedTraits.enum?.find(col => col.value === value)
                      );
                      if (!isDefined(firstValue)) return;

                      traits
                        .pushObject(stratumId, "enum")
                        ?.setTrait(stratumId, "value", firstValue);

                      this.openBinIndex.set(key, traits.enum.length - 1);
                    }
                  } as SelectableDimensionButton)
                : undefined
            ])
          }
        : undefined,
      column &&
      (combinedTraits.mapType ?? tableStyleMap.styleMap.type) === "bin"
        ? {
            type: "group",
            id: "Bin styles",
            isOpen: true,
            selectableDimensions: filterOutUndefined([
              ...traits.bin.map((binPoint, idx) => {
                const dims: SelectableDimensionGroup = {
                  type: "group",
                  id: `${key}-bin-${idx}`,
                  name: styleDims.bin[idx].label,
                  isOpen: this.openBinIndex.get(key) === idx,
                  onToggle: open => {
                    if (open && this.openBinIndex.get(key) !== idx) {
                      runInAction(() => this.openBinIndex.set(key, idx));
                      return true;
                    }
                  },
                  selectableDimensions: filterOutUndefined([
                    idx > 0
                      ? {
                          type: "numeric",
                          id: `${key}-bin-${idx}-start`,
                          name: "Start",
                          value: traits.bin[idx - 1].maxValue ?? undefined,
                          setDimensionValue: (stratumId, value) => {
                            traits.bin[idx - 1].setTrait(
                              stratumId,
                              "maxValue",
                              value
                            );
                          }
                        }
                      : undefined,
                    {
                      type: "numeric",
                      id: `${key}-bin-${idx}-stop`,
                      name: "Stop",
                      value: binPoint.maxValue ?? undefined,
                      setDimensionValue: (stratumId, value) => {
                        binPoint.setTrait(stratumId, "maxValue", value);
                      }
                    },
                    ...styleDims.bin[idx].dims,
                    {
                      type: "button",
                      id: `${key}-bin-${idx}-remove`,
                      value: "Remove",
                      setDimensionValue: stratumId => {
                        binPoint.setTrait(stratumId, "maxValue", null);
                      }
                    }
                  ])
                };
                return dims;
              }),
              {
                type: "button",
                id: `${key}-bin-add`,
                value: styleDims.addBinLabel,
                setDimensionValue: stratumId => {
                  traits.pushObject(stratumId, "bin");
                  this.openBinIndex.set(key, traits.bin.length - 1);
                }
              } as SelectableDimensionButton
            ])
          }
        : undefined,
      {
        type: "group",
        id: `${key}-null`,
        name: styleDims.null.label,
        isOpen:
          !column ||
          !combinedTraits.mapType ||
          combinedTraits.mapType === "constant",
        selectableDimensions: styleDims.null.dims
      }
    ]);
  }

  @computed get markerDims(): SelectableDimensionWorkflowGroup[] {
    const pointTraits = this.item.styles[this.tableStyle.styleNumber ?? -1]
      ?.point;

    return this.getStyleDims(
      "point",
      pointTraits,
      this.tableStyle.pointTraits,
      this.tableStyle.pointStyleColumn,
      this.tableStyle.pointStyleMap,
      {
        null: {
          dims: this.getMarkerDims(
            "marker-null",
            pointTraits.null,
            this.tableStyle.pointTraits.null
          ),
          label: "Default marker"
        },
        bin: this.tableStyle.pointTraits.bin.map((bin, idx) => ({
          dims: this.getMarkerDims(
            `marker-bin-${idx}`,
            bin,
            this.tableStyle.pointTraits.bin[idx]
          ),
          label: getMarkerPreview(
            this.tableStyle.pointTraits.bin[idx],
            !isDefined(bin.maxValue ?? undefined)
              ? "No value"
              : `${
                  idx > 0 &&
                  isDefined(
                    this.tableStyle.pointTraits.bin[idx - 1].maxValue ??
                      undefined
                  )
                    ? `${this.tableStyle.pointTraits.bin[idx - 1].maxValue} to `
                    : ""
                }${bin.maxValue}`
          )
        })),
        enum: this.tableStyle.pointTraits.enum.map((enumPoint, idx) => ({
          dims: this.getMarkerDims(
            `marker-enum-${idx}`,
            enumPoint,
            this.tableStyle.pointTraits.enum[idx]
          ),
          label: getMarkerPreview(
            this.tableStyle.pointTraits.enum[idx],
            enumPoint.value ?? ""
          )
        })),
        addBinLabel: "Add marker bin",
        addEnumLabel: "Add marker for value"
      }
    );
  }

  @computed get outlineDims(): SelectableDimensionWorkflowGroup[] {
    const outlineTraits = this.item.styles[this.tableStyle.styleNumber ?? -1]
      ?.outline;

    const combinedOutlineTraits = this.tableStyle.outlineTraits;

    return this.getStyleDims(
      "outline",
      outlineTraits,
      combinedOutlineTraits,
      this.tableStyle.outlineStyleColumn,
      this.tableStyle.outlineStyleMap,
      {
        null: {
          dims: getOutlineDims(
            "outline-null",
            outlineTraits.null,
            combinedOutlineTraits.null
          ),
          label: "Default outline"
        },
        bin: combinedOutlineTraits.bin.map((bin, idx) => ({
          dims: getOutlineDims(
            `outline-bin-${idx}`,
            bin,
            combinedOutlineTraits.bin[idx]
          ),
          label: getColorPreview(
            combinedOutlineTraits.bin[idx].color ?? "#000",
            !isDefined(bin.maxValue ?? undefined)
              ? "No value"
              : `${
                  idx > 0 &&
                  isDefined(
                    combinedOutlineTraits.bin[idx - 1].maxValue ?? undefined
                  )
                    ? `${combinedOutlineTraits.bin[idx - 1].maxValue} to `
                    : ""
                }${bin.maxValue}`
          )
        })),
        enum: combinedOutlineTraits.enum.map((enumOutline, idx) => ({
          dims: getOutlineDims(
            `outline-enum-${idx}`,
            enumOutline,
            combinedOutlineTraits.enum[idx]
          ),
          label: getColorPreview(
            combinedOutlineTraits.enum[idx].color ?? "#000",
            enumOutline.value ?? ""
          )
        })),
        addBinLabel: "Add outline bin",
        addEnumLabel: "Add outline for value"
      }
    );
  }

  @computed get fillStyleDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      // Only show color scheme selection if activeStyle exists
      this.item.activeStyle ? this.colorSchemeSelectableDim : undefined,

      // If we are in continuous realm:
      // - Display range
      this.colorSchemeType === "sequential-continuous" ||
      this.colorSchemeType === "diverging-continuous"
        ? this.displayRangeDim
        : undefined,
      // If we are in discrete realm:
      // - Bin maximums
      this.colorSchemeType === "sequential-discrete" ||
      this.colorSchemeType === "diverging-discrete" ||
      this.colorSchemeType === "custom-discrete"
        ? this.binColorDims
        : undefined,
      // If we are in qualitative realm
      this.colorSchemeType === "qualitative" ||
      this.colorSchemeType === "custom-qualitative"
        ? this.enumColorDims
        : undefined,

      this.additionalColorDimensions
    ]);
  }

  /** All of the dimensions! */
  @computed get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      this.tableStyleSelectableDim,

      ...(this.styleType === "fill" ? this.fillStyleDimensions : []),
      ...(this.styleType === "point" ? this.markerDims : []),
      ...(this.styleType === "outline" ? this.outlineDims : []),
      this.styleType === "point-size" ? this.pointSizeDimensions : undefined,

      // Show region mapping dimensions if using region column and showing advanced options
      this.showAdvancedOptions &&
      this.styleType === "fill" &&
      this.tableStyle.colorColumn?.type === TableColumnType.region
        ? this.advancedRegionMappingDimensions
        : undefined,

      // Show advanced table options
      ...(this.showAdvancedOptions ? this.advancedTableDimensions : [])
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

  /** Clear binMaximums (which will automatically generate new ones based on numberOfBins, minimumValue and maximumValue).
   * Then set them have a sensible precision (otherwise there will be way too many digits).
   * This will also clear `minimumValue` and `maximumValue` */
  clearBinMaximums(stratumId: string) {
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "minimumValue",
      undefined
    );
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "maximumValue",
      undefined
    );
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

  /** Set enum value and color for specific index in `enumColors` array */
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

  /** Convenience getter for item.activeTableStyle */
  @computed get tableStyle() {
    return this.item.activeTableStyle;
  }

  /** Get `TableStyleTraits` for the active table style (so we can call `setTraits`).
   */
  getTableStyleTraits(stratumId: string, id: string = this.tableStyle.id) {
    if (id === "Default Style") {
      id = "User Style";
      runInAction(() =>
        this.item.setTrait(stratumId, "activeStyle", "User Style")
      );
    }

    const style =
      this.item.styles?.find(style => style.id === id) ??
      this.item.addObject(stratumId, "styles", id);

    style?.setTrait(stratumId, "hidden", false);

    return style;
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

  getMarkerDims(
    id: string,
    pointTraits: Model<PointSymbolTraits>,
    defaultPointTraits: Model<PointSymbolTraits> | undefined
  ): FlatSelectableDimension[] {
    return filterOutUndefined([
      {
        type: "select",
        id: `${id}-marker`,
        name: "Marker",
        selectedId: pointTraits.marker ?? defaultPointTraits?.marker,
        options: allIcons.map(icon => ({
          id: icon
        })),
        optionRenderer: MarkerOptionRenderer,
        setDimensionValue: (stratumId, value) => {
          pointTraits.setTrait(stratumId, "marker", value);
        }
      },
      {
        type: "numeric",
        id: `${id}-rotation`,
        name: "Rotation",
        value: pointTraits.rotation ?? defaultPointTraits?.rotation,
        setDimensionValue: (stratumId, value) => {
          pointTraits.setTrait(stratumId, "rotation", value);
        }
      },
      !this.tableStyle.pointSizeColumn
        ? {
            type: "numeric",
            id: `${id}-height`,
            name: "Height",
            value: pointTraits.height ?? defaultPointTraits?.height,
            setDimensionValue: (stratumId, value) => {
              pointTraits.setTrait(stratumId, "height", value);
            }
          }
        : undefined,
      !this.tableStyle.pointSizeColumn
        ? {
            type: "numeric",
            id: `${id}-width`,
            name: "Width",
            value: pointTraits.width ?? defaultPointTraits?.width,
            setDimensionValue: (stratumId, value) => {
              pointTraits.setTrait(stratumId, "width", value);
            }
          }
        : undefined
    ]);
  }
}

function getColorPreview(col: string, label: string) {
  return `<div><div style="margin-bottom: -4px; width:20px; height:20px; display:inline-block; background-color:${col} ;"></div> ${label}</div>`;
}

function getMarkerPreview(point: Model<PointSymbolTraits>, label: string) {
  return `<div><img height="${24}px" style="margin-bottom: -4px" src="${getMakiIcon(
    point.marker,
    "#fff",
    1,
    "#000",
    24,
    24
  ) ?? point.marker}"></img> ${label}</div>`;
}

function getOutlineDims(
  id: string,
  outlineTraits: Model<OutlineSymbolTraits>,
  defaultOutlineTraits: Model<OutlineSymbolTraits> | undefined
): FlatSelectableDimension[] {
  return [
    {
      type: "select",
      id: `${id}-marker`,
      name: "Style",
      selectedId: outlineTraits.style ?? defaultOutlineTraits?.style,
      options: [{ id: "solid" }, { id: "dash" }],
      setDimensionValue: (stratumId, value) => {
        if (value === "solid" || value === "dash")
          outlineTraits.setTrait(stratumId, "style", value);
      }
    },
    {
      type: "color",
      id: `${id}-color`,
      name: `Color`,
      value: outlineTraits.color ?? defaultOutlineTraits?.color,
      setDimensionValue: (stratumId, value) => {
        outlineTraits.setTrait(stratumId, "color", value);
      }
    },
    {
      type: "numeric",
      id: `${id}-width`,
      name: "Width",
      value: outlineTraits.width ?? defaultOutlineTraits?.width,
      setDimensionValue: (stratumId, value) => {
        outlineTraits.setTrait(stratumId, "width", value);
      }
    }
  ];
}
