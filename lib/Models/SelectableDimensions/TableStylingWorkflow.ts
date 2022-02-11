import {
  computed,
  observable,
  runInAction,
  reaction,
  IReactionDisposer
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
  SEQUENTIAL_CONTINOUS_SCALES,
  SEQUENTIAL_SCALES
} from "../../Table/TableColorMap";
import { SelectableDimension } from "./SelectableDimensions";
import SelectableDimensionWorkflow from "./SelectableDimensionWorkflow";
import CommonStrata from "../Definition/CommonStrata";

type ColorSchemeType =
  | "sequential-continous"
  | "sequential-discrete"
  | "diverging-continous"
  | "diverging-discrete"
  | "qualitative";

export default class TableStylingWorkflow
  implements SelectableDimensionWorkflow {
  /** This is used to simplify SelectableDimensions available to the user.
   * For example - if equal to `diverging-continous` - then only Diverging continuous color scales will be presented as options
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

  /** Get Traits for the active table style (so we can call setTraits) */
  getActiveTableStyleTraits(stratumId: string) {
    return (
      this.item.styles?.find(
        style => style.id === this.item.activeTableStyle.id
      ) ??
      this.item.addObject(stratumId, "styles", this.item.activeTableStyle.id)
    );
  }

  get name() {
    return `Edit Style: ${getName(this.item)}`;
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  /** This will look at the current colorMap and colorPalette to guess which colorSchemeType is active.
   * This is because TableMixin doesn't have an explicit "colorSchemeType" flag - it will choose the appropriate type based on TableStyleTraits
   * `colorTraits.colorPalette` is also set here if we are only using `tableColorMap.defaultColorPaletteName`
   */
  setColorSchemeTypeFromPalette(): void {
    const colorMap = this.item.activeTableStyle.colorMap;
    const colorPalette = this.item.activeTableStyle.colorTraits.colorPalette;
    const defaultColorPalette = this.item.activeTableStyle.tableColorMap
      .defaultColorPaletteName;

    const colorPaletteWithDefault = colorPalette ?? defaultColorPalette;

    if (colorMap instanceof ContinuousColorMap) {
      if (
        SEQUENTIAL_SCALES.includes(colorPaletteWithDefault) ||
        SEQUENTIAL_CONTINOUS_SCALES.includes(colorPaletteWithDefault)
      ) {
        this.colorSchemeType = "sequential-continous";
        if (!colorPalette) {
          this.getActiveTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_SEQUENTIAL
          );
        }
      } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
        this.colorSchemeType = "diverging-continous";
        this.getActiveTableStyleTraits(CommonStrata.user)?.color.setTrait(
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
            this.getActiveTableStyleTraits(CommonStrata.user)?.color.setTrait(
              CommonStrata.user,
              "colorPalette",
              DEFAULT_SEQUENTIAL
            );
          }
        } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
          this.colorSchemeType = "diverging-discrete";
          this.getActiveTableStyleTraits(CommonStrata.user)?.color.setTrait(
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
        this.getActiveTableStyleTraits(CommonStrata.user)?.color.setTrait(
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

    if (type === "sequential-continous")
      return [...SEQUENTIAL_SCALES, ...SEQUENTIAL_CONTINOUS_SCALES];
    if (type === "sequential-discrete") return SEQUENTIAL_SCALES;
    if (type === "diverging-discrete" || type === "diverging-continous")
      return DIVERGING_SCALES;
    if (type === "qualitative") return QUALITATIVE_SCALES;

    return [];
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    // Here we use item.activeTableStyle.colorTraits.colorPalette instead of this.colorPalette because we only want this to be defined, if the trait is defined - we don't care about defaultColorPaletteName
    const colorPalette = this.item.activeTableStyle.colorTraits.colorPalette;
    return filterOutUndefined([
      {
        type: "group",
        id: "Color scheme",
        selectableDimensions: [
          {
            type: "select",
            id: "Type",
            name: "Type",
            options: [
              { id: "sequential-continous", name: "Sequential (continuous)" },
              { id: "sequential-discrete", name: "Sequential (discrete)" },
              { id: "diverging-continous", name: "Divergent (continuous)" },
              { id: "diverging-discrete", name: "Divergent (discrete)" },
              { id: "qualitative", name: "Qualitative" }
            ],
            selectedId: this.colorSchemeType,
            setDimensionValue: (stratumId, id) => {
              runInAction(() => {
                // If the current colorPalete is incompatible with the selected type - change colorPalette to default for the selected type
                if (
                  id === "sequential-discrete" ||
                  id === "diverging-discrete"
                ) {
                  this.colorSchemeType = id;
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "numberOfBins",
                    7
                  );
                  this.clearBinMaximums(stratumId);
                }
                if (
                  id === "sequential-continous" ||
                  id === "diverging-continous" ||
                  id === "qualitative"
                ) {
                  this.colorSchemeType = id;
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "numberOfBins",
                    undefined
                  );
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "binMaximums",
                    undefined
                  );
                }
                if (
                  id === "sequential-continous" &&
                  (!colorPalette ||
                    ![
                      ...SEQUENTIAL_SCALES,
                      ...SEQUENTIAL_CONTINOUS_SCALES
                    ].includes(colorPalette))
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "colorPalette",
                    DEFAULT_SEQUENTIAL
                  );
                }
                if (
                  id === "sequential-discrete" &&
                  (!colorPalette || !SEQUENTIAL_SCALES.includes(colorPalette))
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "colorPalette",
                    DEFAULT_SEQUENTIAL
                  );
                }
                if (
                  (id === "diverging-continous" ||
                    id === "diverging-discrete") &&
                  (!colorPalette || !DIVERGING_SCALES.includes(colorPalette))
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "colorPalette",
                    DEFAULT_DIVERGING
                  );
                }
                if (
                  id === "qualitative" &&
                  (!colorPalette || !QUALITATIVE_SCALES.includes(colorPalette))
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
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
              this.item.activeTableStyle.colorTraits.colorPalette ??
              this.item.activeTableStyle.tableColorMap.defaultColorPaletteName,
            options: this.colorSchemesForType.map(style => ({
              id: style
            })),
            setDimensionValue: (stratumId, id) => {
              this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                stratumId,
                "colorPalette",
                id
              );
            }
          }
        ]
      },
      this.colorSchemeType === "sequential-continous" ||
      this.colorSchemeType === "diverging-continous"
        ? {
            type: "group",
            id: "Display range",
            selectableDimensions: [
              {
                type: "numeric",
                id: "min",
                name: "Min",
                max: this.item.activeTableStyle.tableColorMap.maximumValue,
                value: this.item.activeTableStyle.tableColorMap.minimumValue,
                setDimensionValue: (stratumId, value) => {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
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
                min: this.item.activeTableStyle.tableColorMap.minimumValue,
                value: this.item.activeTableStyle.tableColorMap.maximumValue,
                setDimensionValue: (stratumId, value) => {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "maximumValue",
                    value
                  );
                }
              }
            ]
          }
        : undefined,
      ...(this.colorSchemeType === "sequential-discrete" ||
      this.colorSchemeType === "diverging-discrete"
        ? ([
            {
              type: "group",
              id: "Number of bins",
              selectableDimensions: [
                {
                  type: "numeric",
                  id: "numberOfBins",
                  min: 3,
                  max: 11,
                  value: this.item.activeTableStyle.colorTraits.numberOfBins,
                  setDimensionValue: (stratumId, value) => {
                    this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                      stratumId,
                      "numberOfBins",
                      value
                    );
                    if (
                      this.item.activeTableStyle.tableColorMap.binMaximums
                        .length !== value
                    ) {
                      const binMaximums = [
                        ...this.item.activeTableStyle.tableColorMap.binMaximums
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
            },
            {
              type: "group",
              id: "Bins",
              selectableDimensions: [
                {
                  type: "numeric",
                  id: "bin-min",
                  max: this.item.activeTableStyle.tableColorMap.maximumValue,
                  value: this.item.activeTableStyle.tableColorMap.minimumValue,
                  setDimensionValue: (stratumId, value) => {
                    this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                      stratumId,
                      "minimumValue",
                      value
                    );
                    this.setBinMaximums(stratumId);
                  }
                },
                ...this.item.activeTableStyle.tableColorMap.binMaximums.map(
                  (bin, idx) =>
                    ({
                      type: "numeric",
                      id: `bin-${idx}`,
                      value: bin,
                      setDimensionValue: (stratumId, value) => {
                        const binMaximums = [
                          ...this.item.activeTableStyle.tableColorMap
                            .binMaximums
                        ];
                        if (isDefined(idx) && isDefined(value))
                          binMaximums[idx] = value;
                        this.setBinMaximums(stratumId, binMaximums);
                      }
                    } as SelectableDimension)
                )
              ]
            }
          ] as SelectableDimension[])
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
      binMaximums = [...this.item.activeTableStyle.tableColorMap.binMaximums];
    const colorTraits = this.getActiveTableStyleTraits(stratumId)?.color;
    if (
      binMaximums[binMaximums.length - 1] !==
      this.item.activeTableStyle.tableColorMap.maximumValue
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
    this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      undefined
    );
    const binMaximums = this.item.activeTableStyle.tableColorMap.binMaximums.map(
      bin =>
        parseFloat(
          bin.toFixed(
            this.item.activeTableStyle.numberFormatOptions
              ?.maximumFractionDigits
          )
        )
    );
    this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      binMaximums
    );
  }
}
