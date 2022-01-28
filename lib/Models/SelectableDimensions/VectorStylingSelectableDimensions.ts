import { computed } from "mobx";
import GeoJsonMixin from "../../ModelMixins/GeojsonMixin";
import SelectableDimensions, {
  SelectableDimension
} from "../SelectableDimensions";
import TableStylingSelectableDimensions from "./TableStylingSelectableDimensions";

class VectorStylingSelectableDimensions implements SelectableDimensions {
  private tableStylingSelectableDimensions: TableStylingSelectableDimensions;

  constructor(readonly model: GeoJsonMixin.Instance) {
    this.tableStylingSelectableDimensions = new TableStylingSelectableDimensions(
      model
    );
  }

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
      ...this.tableStylingSelectableDimensions.selectableDimensions,
      {
        type: "group",
        id: "Stroke",
        selectableDimensions: [
          {
            type: "select",
            id: "Width",
            name: "Width",
            options: [
              { id: "1", name: "1px" },
              { id: "2", name: "2px" },
              { id: "3", name: "3px" }
            ],
            setDimensionValue: (stratumId, id) => {}
          },
          {
            type: "select",
            id: "Color",
            name: "Color",
            options: [{ id: "White" }, { id: "Black" }],
            selectedId:
              this.model.stylesWithDefaults.stroke.toCssHexString() ===
              "#ffffff"
                ? "White"
                : this.model.stylesWithDefaults.stroke.toCssHexString() ===
                  "#000000"
                ? "Black"
                : undefined,
            undefinedLabel: "Other",
            setDimensionValue: (stratumId, id) => {
              this.model.style.setTrait(
                stratumId,
                "stroke",
                id === "White" ? "#ffffff" : "#000000"
              );
            }
          }
        ]
      }
    ];
  }
}
