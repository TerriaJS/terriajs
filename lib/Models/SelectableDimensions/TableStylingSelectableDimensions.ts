import * as d3Scale from "d3-scale-chromatic";
import { computed } from "mobx";
import TableMixin from "../../ModelMixins/TableMixin";
import SelectableDimensions, {
  SelectableDimension
} from "../SelectableDimensions";

export default class TableStylingSelectableDimensions
  implements SelectableDimensions {
  constructor(readonly model: TableMixin.Instance) {}

  /** Get Traits for the active table style (so we can call setTraits) */
  getActiveTableStyleTraits(stratumId: string) {
    return (
      this.model.styles?.find(
        style => style.id === this.model.activeTableStyle.id
      ) ??
      this.model.addObject(stratumId, "styles", this.model.activeTableStyle.id)
    );
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    return [
      {
        type: "group",
        id: "Display range",
        selectableDimensions: [
          {
            type: "numeric",
            id: "min",
            name: "Min",
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
            setDimensionValue: (stratumId, value) => {
              this.getActiveTableStyleTraits(stratumId)?.color.setTrait(
                stratumId,
                "maximumValue",
                value
              );
            }
          }
        ]
      },
      {
        type: "group",
        id: "Color scheme",
        selectableDimensions: [
          {
            type: "select",
            id: "Type",
            name: "Type",
            options: [
              { id: "Sequential (continuous)" },
              { id: "Sequential (discrete)" },
              { id: "Divergent (continuous)" },
              { id: "Divergent (discrete)" },
              { id: "Qualitative" }
            ],
            selectedId: "Sequential (continuous)",
            setDimensionValue: (stratumId, id) => {}
          },
          {
            type: "select",
            id: "Scheme",
            name: "Scheme",
            selectedId:
              this.model.activeTableStyle.colorTraits.colorPalette ??
              this.model.activeTableStyle.tableColorMap.defaultColorPaletteName,
            options: Object.keys(d3Scale)
              .filter(scale => scale.startsWith("interpolate"))
              .map(style => ({
                id: style.split("interpolate")[1]
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
      }
    ];
  }
}
