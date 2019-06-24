"use strict";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "./CameraView";
import GlobeOrMap from "./GlobeOrMap";
import Mappable from "./Mappable";
import Terria from "./Terria";

class NoViewer extends GlobeOrMap {
  readonly terria: Terria;

  constructor(terria: Terria) {
    super();
    this.terria = terria;
  }

  destroy() {}

  zoomTo(v: CameraView | Cesium.Rectangle | Mappable, t: any) {
    // Set initial view?
  }

  notifyRepaintRequired() {}

  getCurrentCameraView(): CameraView {
    return new CameraView(Rectangle.fromDegrees(120, -45, 155, -15)); // This is just a random rectangle. Replace it when there's a home view available
  }

  getContainer() {
    return undefined;
  }

  pauseMapInteraction() {}
  resumeMapInteraction() {}
}

export default NoViewer;
