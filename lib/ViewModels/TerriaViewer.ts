import { computed, IComputedValue, IObservableValue, observable } from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "../Models/CameraView";
import Cesium from "../Models/Cesium";
import GlobeOrMap from "../Models/GlobeOrMap";
import Leaflet from "../Models/Leaflet";
import Mappable from "../Models/Mappable";
import NoViewer from "../Models/NoViewer";
import Terria from "../Models/Terria";

// A class that deals with initialising, destroying and switching between viewers
// Each map-view should have it's own TerriaViewer

// Viewer options. Designed to be easily serialisable
interface ViewerOptions {
  useTerrain: boolean;
  [key: string]: string | number | boolean;
}

const viewerOptionsDefaults: ViewerOptions = {
  useTerrain: true
};

export default class TerriaViewer {
  readonly terria: Terria;

  @observable
  baseMap: Mappable | undefined;

  // This is a "view" of a workbench/other
  readonly items: IComputedValue<Mappable[]> | IObservableValue<Mappable[]>;

  @observable
  viewerMode: string | undefined = "cesium";

  // Set by UI
  @observable
  viewerOptions: ViewerOptions = viewerOptionsDefaults;

  // Disable all mouse (& keyboard) interaction
  @observable
  disableInteraction: boolean = false;

  @observable
  homeCamera: CameraView = new CameraView(Rectangle.MAX_VALUE);

  @observable
  mapContainer: string | HTMLElement | undefined;

  // TODO: hook these up
  readonly beforeViewerChanged = new CesiumEvent();
  readonly afterViewerChanged = new CesiumEvent();

  constructor(terria: Terria, items: IComputedValue<Mappable[]>) {
    this.terria = terria;
    this.items = items;
  }

  @computed
  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  private _lastViewer: GlobeOrMap | undefined;

  @computed({
    keepAlive: true
  })
  get currentViewer(): GlobeOrMap {
    const currentView = this.destroyCurrentViewer();

    const viewerMode = this.attached ? this.viewerMode : undefined;
    console.log(`Creating a viewer: ${viewerMode}`);

    let newViewer: GlobeOrMap;
    if (this.mapContainer && viewerMode === "leaflet") {
      newViewer = new Leaflet(this, this.mapContainer);
    } else if (this.mapContainer && viewerMode === "cesium") {
      newViewer = new Cesium(this, this.mapContainer);
    } else {
      newViewer = new NoViewer(this.terria);
    }

    this._lastViewer = newViewer;

    newViewer.zoomTo(currentView || this.homeCamera, 0.0);

    return newViewer;
  }

  // Pull out attaching logic into it's own step. This allows constructing a TerriaViewer
  // before its UI element is mounted in React to set basemap, items, viewermode
  attach(mapContainer?: string | HTMLElement) {
    this.mapContainer = mapContainer;
  }

  detach() {
    // Detach from a container
    this.mapContainer = undefined;
    this.destroyCurrentViewer();
  }

  private destroyCurrentViewer() {
    let currentView: CameraView | undefined;
    if (this._lastViewer !== undefined) {
      console.log(`Destroying a viewer`);
      currentView = this._lastViewer.getCurrentCameraView();
      this._lastViewer.destroy();
      this._lastViewer = undefined;
    }
    return currentView;
  }
}
