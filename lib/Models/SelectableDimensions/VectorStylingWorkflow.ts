import { computed } from "mobx";
import GeoJsonMixin from "../../ModelMixins/GeojsonMixin";
import { SelectableDimension } from "../SelectableDimensions";
import TableStylingWorkflow from "./TableStylingSelectableDimensions";

export default class VectorStylingWorkflow extends TableStylingWorkflow {
  constructor(readonly item: GeoJsonMixin.Instance) {
    super(item);
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    return [
      ...super.selectableDimensions,
      {
        type: "group",
        id: "Point size",
        selectableDimensions: [
          {
            type: "select",
            id: "marker-size",
            options: [
              { id: "small", name: "Small" },
              { id: "medium", name: "Medium" },
              { id: "large", name: "Large" }
            ],
            undefinedLabel: "Other",
            selectedId: this.item.style["marker-size"],
            setDimensionValue: (stratumId, id) => {
              this.item.style.setTrait(stratumId, "marker-size", id);
            }
          }
        ]
      },
      {
        type: "group",
        id: "Stroke",
        selectableDimensions: [
          {
            type: "select",
            id: "Color",
            name: "Color",
            options: [{ id: "White" }, { id: "Black" }],
            selectedId:
              this.item.stylesWithDefaults.stroke.toCssHexString() === "#ffffff"
                ? "White"
                : this.item.stylesWithDefaults.stroke.toCssHexString() ===
                  "#000000"
                ? "Black"
                : undefined,
            undefinedLabel: "Other",
            setDimensionValue: (stratumId, id) => {
              this.item.style.setTrait(
                stratumId,
                "stroke",
                id === "White" ? "#ffffff" : "#000000"
              );
            }
          },
          {
            type: "numeric",
            id: "Width",
            name: "Width",
            value: Math.max(
              this.item.stylesWithDefaults.polylineStrokeWidth,
              this.item.stylesWithDefaults.polygonStrokeWidth,
              this.item.stylesWithDefaults.markerStrokeWidth
            ),
            setDimensionValue: (stratumId, value) => {
              this.item.style.setTrait(stratumId, "marker-stroke-width", value);
              this.item.style.setTrait(
                stratumId,
                "polygon-stroke-width",
                value
              );
              this.item.style.setTrait(
                stratumId,
                "polyline-stroke-width",
                value
              );
            }
          }
        ]
      }
    ];
  }
}
