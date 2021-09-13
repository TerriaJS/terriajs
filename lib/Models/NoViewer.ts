"use strict";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import LatLonHeight from "../Core/LatLonHeight";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import { ProviderCoordsMap } from "../Map/PickedFeatures";
import MappableMixin from "../ModelMixins/MappableMixin";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import Terria from "./Terria";

class NoViewer extends GlobeOrMap {
  readonly type = "none";
  readonly terria: Terria;
  readonly canShowSplitter = false;
  private _currentView: CameraView = new CameraView(Rectangle.MAX_VALUE);

  constructor(terriaViewer: TerriaViewer) {
    super();
    this.terria = terriaViewer.terria;
  }

  destroy() {}

  doZoomTo(
    v: CameraView | Rectangle | MappableMixin.Instance,
    t: any
  ): Promise<void> {
    if (v instanceof CameraView) {
      this._currentView = v;
    } else if (v instanceof Rectangle) {
      this._currentView = new CameraView(v);
    }
    return Promise.resolve();
  }

  notifyRepaintRequired() {}

  pickFromLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap,
    existingFeatures: Feature[]
  ) {}

  /**
   * Return features at a latitude, longitude and (optionally) height for the given imageryLayer
   * @param latLngHeight The position on the earth to pick
   * @param providerCoords A map of imagery provider urls to the tile coords used to get features for those imagery
   * @returns A flat array of all the features for the given tiles that are currently on the map
   */
  getFeaturesAtLocation(
    latLngHeight: LatLonHeight,
    providerCoords: ProviderCoordsMap
  ) {}

  getCurrentCameraView(): CameraView {
    return this._currentView;
  }

  getContainer() {
    return undefined;
  }

  pauseMapInteraction() {}
  resumeMapInteraction() {}
  _addVectorTileHighlight(
    imageryProvider: MapboxVectorTileImageryProvider,
    rectangle: Rectangle
  ) {
    return () => {};
  }
}

export default NoViewer;
