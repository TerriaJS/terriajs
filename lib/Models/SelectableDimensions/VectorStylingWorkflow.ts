import { computed, action } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import GeoJsonMixin, { parseMarkerSize } from "../../ModelMixins/GeojsonMixin";
import Icon from "../../Styled/Icon";
import SelectableDimensionWorkflow, {
  SelectableDimensionWorkflowGroup
} from "./SelectableDimensionWorkflow";
import TableStylingWorkflow from "./TableStylingWorkflow";
import CommonStrata from "../Definition/CommonStrata";

/** SelectableDimensionWorkflow to set styling options for GeoJson models (only Protomaps/geojson-vt).
 * This also includes all dimensions from TableStylingWorkflow
 */

export default class VectorStylingWorkflow
  implements SelectableDimensionWorkflow {
  static type = "vector-styling";
  readonly type = VectorStylingWorkflow.type;
  readonly tableStylingWorkflow: TableStylingWorkflow;

  constructor(readonly item: GeoJsonMixin.Instance) {
    this.tableStylingWorkflow = new TableStylingWorkflow(item);
  }

  get name() {
    return "Style";
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  get footer() {
    return {
      ...this.tableStylingWorkflow.footer,
      onClick: action(() => {
        this.tableStylingWorkflow.footer.onClick();
        this.item.style.strata.delete(CommonStrata.user);
      })
    };
  }

  get menu() {
    return this.tableStylingWorkflow.menu;
  }

  /** Point dimensions:
   * - Marker size
   * - Marker stroke color
   * - Marker stroke width
   */
  @computed get pointSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Point/Marker",
      isOpen: false,
      selectableDimensions: [
        {
          type: "numeric",
          id: "marker-size",
          name: "Marker size",
          min: 1,
          value:
            parseMarkerSize(this.item.style["marker-size"]) ??
            this.item.stylesWithDefaults.markerSize,
          setDimensionValue: (stratumId, id) => {
            this.item.style.setTrait(stratumId, "marker-size", id?.toString());
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

  /** Line dimensions:
   * - Stroke width
   */
  @computed get lineSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Lines",
      isOpen: false,
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

  /** Polygon dimensions:
   * - Stroke color
   * - Stroke width
   */
  @computed get polygonSelectableDimension(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "Polygons",
      isOpen: false,
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

  /** All dimensions:
   * - Include all dimensions from TableStylingWorkflow
   * - Include point, line and polygon dimensions if those features exist in the item
   */
  @computed get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      ...this.tableStylingWorkflow.selectableDimensions,
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
