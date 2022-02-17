import { computed } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import GeoJsonMixin from "../../ModelMixins/GeojsonMixin";
import { SelectableDimensionWorkflowGroup } from "./SelectableDimensions";
import TableStylingWorkflow from "./TableStylingWorkflow";

export default class VectorStylingWorkflow extends TableStylingWorkflow {
  constructor(readonly item: GeoJsonMixin.Instance) {
    super(item);
  }

  @computed get pointSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Point/Marker",
      selectableDimensions: [
        {
          type: "select",
          id: "marker-size",
          name: "Marker size",
          options: [
            { id: "small", name: "Small" },
            { id: "medium", name: "Medium" },
            { id: "large", name: "Large" }
          ],
          undefinedLabel: "Other",
          selectedId: this.item.style["marker-size"] ?? "small",
          setDimensionValue: (stratumId, id) => {
            this.item.style.setTrait(stratumId, "marker-size", id);
          }
        },
        {
          type: "color",
          id: "marker-stroke-color",
          name: "Stroke color",
          value:
            this.item.style["marker-stroke"] ??
            this.item.stylesWithDefaults.markerStroke.toCssHexString(),
          setDimensionValue: (stratumId, value) => {
            this.item.style.setTrait(stratumId, "marker-stroke", value);
          }
        },
        {
          type: "numeric",
          id: "marker-stroke-width",
          name: "Stroke width",
          min: 0,
          value: this.item.stylesWithDefaults.markerStrokeWidth,
          setDimensionValue: (stratumId, value) => {
            this.item.style.setTrait(stratumId, "marker-stroke-width", value);
          }
        }
      ]
    };
  }

  @computed get lineSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Lines",
      selectableDimensions: [
        {
          type: "numeric",
          id: "line-stroke-width",
          name: "Stroke width",
          min: 0,
          value: this.item.stylesWithDefaults.polylineStrokeWidth,
          setDimensionValue: (stratumId, value) => {
            this.item.style.setTrait(stratumId, "polyline-stroke-width", value);
          }
        }
      ]
    };
  }

  @computed get polygonSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Polygons",
      selectableDimensions: [
        {
          type: "color",
          id: "polygon-stroke-color",
          name: "Stroke color",
          value:
            this.item.style["polygon-stroke"] ??
            this.item.stylesWithDefaults.polygonStroke.toCssHexString(),
          setDimensionValue: (stratumId, value) => {
            this.item.style.setTrait(stratumId, "polygon-stroke", value);
          }
        },
        {
          type: "numeric",
          id: "polygon-stroke-width",
          name: "Stroke width",
          min: 0,
          value: this.item.stylesWithDefaults.polygonStrokeWidth,
          setDimensionValue: (stratumId, value) => {
            this.item.style.setTrait(stratumId, "polygon-stroke-width", value);
          }
        }
      ]
    };
  }

  @computed get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      ...super.selectableDimensions,
      this.item.featureCounts.point > 0
        ? this.pointSelectableDimension
        : undefined,
      this.item.featureCounts.line > 0
        ? this.lineSelectableDimension
        : undefined,
      this.item.featureCounts.polygon > 0
        ? this.polygonSelectableDimension
        : undefined
    ]);
  }
}
