import { computed, observable, runInAction } from "mobx";
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
import { SelectableDimension } from "../SelectableDimensions";
import SelectableDimensionWorkflow from "./SelectableDimensionWorkflow";

type ColorSchemeType =
  | "sequential-continous"
  | "sequential-discrete"
  | "diverging-continous"
  | "diverging-discrete"
  | "qualitative";

export default class TableStylingWorkflow
  implements SelectableDimensionWorkflow {
  @observable colorSchemeType: ColorSchemeType | undefined;

  constructor(readonly item: TableMixin.Instance) {
    this.colorSchemeType = this.getColorSchemeTypeFromPalette();
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

  get showLegend() {
    return true;
  }

  getColorSchemeTypeFromPalette(): ColorSchemeType | undefined {
    const palette =
      this.item.activeTableStyle.colorTraits.colorPalette ??
      this.item.activeTableStyle.tableColorMap.defaultColorPaletteName;

    const colorMap = this.item.activeTableStyle.colorMap;

    if (colorMap instanceof ContinuousColorMap) {
      if (
        SEQUENTIAL_SCALES.includes(palette) ||
        SEQUENTIAL_CONTINOUS_SCALES.includes(palette)
      )
        return "sequential-continous";
      if (DIVERGING_SCALES.includes(palette)) return "diverging-continous";
    }

    if (colorMap instanceof DiscreteColorMap) {
      if (SEQUENTIAL_SCALES.includes(palette)) return "sequential-discrete";
      if (DIVERGING_SCALES.includes(palette)) return "diverging-discrete";
    }

    if (
      colorMap instanceof EnumColorMap &&
      QUALITATIVE_SCALES.includes(palette)
    )
      return "qualitative";
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
                  id === "sequential-continous" ||
                  id === "sequential-discrete"
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "colorPalette",
                    DEFAULT_SEQUENTIAL
                  );
                }
                if (
                  id === "diverging-continous" ||
                  id === "diverging-discrete"
                ) {
                  this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "colorPalette",
                    DEFAULT_DIVERGING
                  );
                }
                if (id === "qualitative") {
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
                      this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                        stratumId,
                        "binMaximums",
                        undefined
                      );
                    }
                  }
                }
              ]
            },
            {
              type: "group",
              id: "Bin maximums",
              selectableDimensions: this.item.activeTableStyle.tableColorMap.binMaximums.map(
                (bin, idx) =>
                  ({
                    type: "numeric",
                    id: `bin-${idx}`,
                    value: bin,
                    setDimensionValue: (stratumId, value) => {
                      const binMaximums = [
                        ...this.item.activeTableStyle.tableColorMap.binMaximums
                      ];
                      binMaximums[idx] = value;
                      this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                        stratumId,
                        "binMaximums",
                        binMaximums
                      );
                    }
                  } as SelectableDimension)
              )
            }
          ] as SelectableDimension[])
        : [])
    ]);
  }
}
