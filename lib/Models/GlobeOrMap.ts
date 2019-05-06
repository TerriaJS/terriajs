import Mappable from "./Mappable";

export type CameraView = {
  rectangle: Cesium.Rectangle;
  position: any;
  direction: any;
  up: any;
};

export default interface GlobeOrMap {
  destroy(): void;
  zoomTo(
    viewOrExtent: CameraView | Cesium.Rectangle | Mappable,
    flightDurationSeconds: number
  ): void;
  getCurrentExtent(): Cesium.Rectangle;
}
