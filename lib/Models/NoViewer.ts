"use strict";

import { observable } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import MappableMixin from "../ModelMixins/MappableMixin";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import GlobeOrMap from "./GlobeOrMap";
import Terria from "./Terria";

class NoViewer extends GlobeOrMap {
  readonly type = "none";
  readonly terria: Terria;
  readonly canShowSplitter = false;
  private _currentView: CameraView = new CameraView(Rectangle.MAX_VALUE);
  readonly dataAttributions = observable([]);

  constructor(terriaViewer: TerriaViewer) {
    super();
    this.terria = terriaViewer.terria;
  }

  destroy() {
    // no-op
  }

  doZoomTo(v: CameraView | Rectangle | MappableMixin.Instance): Promise<void> {
    if (v instanceof CameraView) {
      this._currentView = v;
    } else if (v instanceof Rectangle) {
      this._currentView = new CameraView(v);
    }
    return Promise.resolve();
  }

  notifyRepaintRequired() {
    // no-op
  }

  pickFromLocation() {
    // no-op
  }

  /**
   * Return features at a latitude, longitude and (optionally) height for the given imageryLayer
   * @param latLngHeight The position on the earth to pick
   * @param providerCoords A map of imagery provider urls to the tile coords used to get features for those imagery
   * @returns A flat array of all the features for the given tiles that are currently on the map
   */
  getFeaturesAtLocation() {
    // no-op
  }

  getCurrentCameraView(): CameraView {
    return this._currentView;
  }

  getContainer() {
    return undefined;
  }

  pauseMapInteraction() {
    // no-op
  }
  resumeMapInteraction() {
    // no-op
  }
  _addVectorTileHighlight() {
    return () => {
      // no-op
    };
  }
}

export default NoViewer;
