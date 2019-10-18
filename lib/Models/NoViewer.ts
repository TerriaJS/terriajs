"use strict";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "./CameraView";
import GlobeOrMap from "./GlobeOrMap";
import Mappable from "./Mappable";
import Terria from "./Terria";
import TerriaViewer from "../ViewModels/TerriaViewer";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";

class NoViewer extends GlobeOrMap {
    readonly type = "none";
    readonly terria: Terria;
    private _currentView: CameraView = new CameraView(Rectangle.MAX_VALUE);

    constructor(terriaViewer: TerriaViewer) {
        super();
        this.terria = terriaViewer.terria;
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
    _addVectorTileHighlight(
        imageryProvider: MapboxVectorTileImageryProvider,
        rectangle: Cesium.Rectangle
    ) {
        return () => {};
    }
}

export default NoViewer;
