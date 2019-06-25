"use strict";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "./CameraView";
import GlobeOrMap from "./GlobeOrMap";
import Mappable from "./Mappable";
import Terria from "./Terria";

class NoViewer extends GlobeOrMap {
  readonly terria: Terria;
  private _currentView: CameraView = new CameraView(Rectangle.MAX_VALUE);

  constructor(terria: Terria) {
    super();
    this.terria = terria;
  }

  destroy() {}

  zoomTo(v: CameraView | Cesium.Rectangle | Mappable, t: any) {
    if (v instanceof CameraView) {
      this._currentView = v;
    } else if (v instanceof Rectangle) {
      this._currentView = new CameraView(v);
    }
  }

  notifyRepaintRequired() {}

  getCurrentCameraView(): CameraView {
    return this._currentView;
  }

  getContainer() {
    return undefined;
  }

  pauseMapInteraction() {}
  resumeMapInteraction() {}
}

export default NoViewer;
