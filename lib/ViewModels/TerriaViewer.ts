import {
  computed,
  IComputedValue,
  observable,
  reaction,
  runInAction
} from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
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
  // Do we need to store the map container?
  // private _container: string | HTMLElement | undefined;
  private _stopViewerReaction: (() => void) | undefined;

  @observable
  baseMap: Mappable | undefined;

  // TODO: Is IComputedValue the correct type semantically?
  // It will correctly accept either an observable.box(val) or computed(() => val + val2)
  // But the type signature doesn't really signify that.
  // Need something like an IReactiveValue
  // This is a "view" of a workbench/other
  readonly items: IComputedValue<Mappable[]>;

  @observable
  _attached: boolean = false;

  @observable
  viewerMode: string | undefined = "cesium";

  @observable
  private _currentViewer: GlobeOrMap | undefined;

  // Set by UI
  @observable
  viewerOptions: ViewerOptions = viewerOptionsDefaults;

  // Random rectangle. Work out reactivity
  defaultExtent: Rectangle = Rectangle.fromDegrees(120, -45, 155, -15);

  constructor(terria: Terria, items: IComputedValue<Mappable[]>) {
    this.terria = terria;
    this.items = items;
  }

  @computed
  get attached(): boolean {
    return this._attached;
  }

  @computed
  get currentViewer(): GlobeOrMap {
    return this._currentViewer || new NoViewer(this.terria);
  }

  // Pull out attaching logic into it's own step. This allows constructing a TerriaViewer
  // before it's UI element is mounted in React to set basemap, items, viewermode
  attach(mapContainer?: string | HTMLElement) {
    if (this._attached) {
      throw new DeveloperError(
        "Attempted to attach TerriaViewer to a container when it was already attached"
      );
    }
    this._attached = true;
    const container =
      mapContainer !== undefined ? mapContainer : "cesiumContainer";

    // A "computed" for _currentViewer
    this._stopViewerReaction = reaction(
      () => ({ viewerMode: this.viewerMode, attached: this._attached }),
      ({ viewerMode, attached }) => {
        let bounds: Rectangle | undefined;
        if (this._currentViewer !== undefined) {
          // Get viewer parameters to apply to new viewer
          // terriaViewer.currentViewer.getCamera...
          bounds = this._currentViewer.getCurrentExtent();
          this._currentViewer.destroy();
        }
        const newViewer =
          attached && viewerMode !== undefined
            ? this.createViewer(viewerMode, container)
            : undefined;
        // Apply previous parameters
        if (newViewer !== undefined) {
          newViewer.zoomTo(bounds || this.defaultExtent, 0.0);
        }
        runInAction(() => {
          this._currentViewer = newViewer;
        });
      },
      { fireImmediately: true }
    );
  }

  private createViewer(
    viewerMode: string,
    container: string | HTMLElement
  ): GlobeOrMap | undefined {
    console.log(`Creating a viewer: ${viewerMode}`);

    if (viewerMode === "leaflet") {
      return new Leaflet(this, container);
    } else if (viewerMode === "cesium") {
      return new Cesium(this, container);
    }
  }

  detach() {
    // Detach from a container
    // Can then be attached to another container, if needed
    this._attached = false;
    if (this._stopViewerReaction !== undefined) {
      this._stopViewerReaction();
    }
  }
}
