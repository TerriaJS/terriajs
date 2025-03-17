import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import LatLonHeight from "../Core/LatLonHeight";
import ProtomapsImageryProvider from "../Map/ImageryProvider/ProtomapsImageryProvider";
import { ProviderCoordsMap } from "../Map/PickedFeatures/PickedFeatures";
import MappableMixin from "../ModelMixins/MappableMixin";
import TerriaViewer from "../ViewModels/TerriaViewer";
import CameraView from "./CameraView";
import TerriaFeature from "./Feature/Feature";
import GlobeOrMap from "./GlobeOrMap";
import Terria from "./Terria";

class NoViewer extends GlobeOrMap {
  static readonly type = "none";
  readonly type = NoViewer.type;

  readonly terria: Terria;
  readonly canShowSplitter = false;
  private _currentView: CameraView = new CameraView(Rectangle.MAX_VALUE);

  constructor(terriaViewer: TerriaViewer, _container?: string | HTMLElement) {
    super();
    this.terria = terriaViewer.terria;
  }

  destroy(): void {}

  doZoomTo(
    v: CameraView | Rectangle | MappableMixin.Instance,
    _t: any
  ): Promise<void> {
    if (v instanceof CameraView) {
      this._currentView = v;
    } else if (v instanceof Rectangle) {
      this._currentView = new CameraView(v);
    }
    return Promise.resolve();
  }

  notifyRepaintRequired(): void {}

  pickFromLocation(
    _latLngHeight: LatLonHeight,
    _providerCoords: ProviderCoordsMap,
    _existingFeatures: TerriaFeature[]
  ): void {}

  getCurrentCameraView(): CameraView {
    return this._currentView;
  }

  getContainer() {
    return undefined;
  }

  pauseMapInteraction(): void {}
  resumeMapInteraction(): void {}
  _addVectorTileHighlight(
    _imageryProvider: ProtomapsImageryProvider,
    _rectangle: Rectangle
  ) {
    return () => {};
  }
}

export default NoViewer;
