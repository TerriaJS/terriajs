import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import MappableMixin from "../ModelMixins/MappableMixin";
import CameraView from "../Models/CameraView";

/**
 * Target types that a Cesium globe or Leaflet map can zoom to.
 * @see {@link GlobeOrMap.zoomTo}
 */
export type ZoomTarget =
  | Rectangle
  | CameraView
  | MappableMixin.Instance
  | MappableMixin.Instance[];
