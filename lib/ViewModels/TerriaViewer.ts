import {
  action,
  computed,
  IComputedValue,
  IObservableValue,
  observable,
  untracked,
  runInAction
} from "mobx";
import { fromPromise, FULFILLED } from "mobx-utils";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import MappableMixin from "../ModelMixins/MappableMixin";
import CameraView from "../Models/CameraView";
import GlobeOrMap from "../Models/GlobeOrMap";
import NoViewer from "../Models/NoViewer";
import Terria from "../Models/Terria";
import ViewerMode from "../Models/ViewerMode";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TerriaError from "../Core/TerriaError";

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
  private _baseMap: MappableMixin.Instance | undefined;

  get baseMap() {
    return this._baseMap;
  }

  async setBaseMap(baseMap?: MappableMixin.Instance) {
    if (!baseMap) return;

    if (baseMap) {
      const result = await baseMap.loadMapItems();
      if (result.error) {
        result.raiseError(this.terria, {
          title: {
            key: "models.terria.loadingBaseMapErrorTitle",
            parameters: {
              name:
                (CatalogMemberMixin.isMixedInto(baseMap)
                  ? baseMap.name
                  : baseMap.uniqueId) ?? "Unknown item"
            }
          }
        });
      } else {
        runInAction(() => (this._baseMap = baseMap));
      }
    }
  }

  // This is a "view" of a workbench/other
  readonly items:
    | IComputedValue<MappableMixin.Instance[]>
    | IObservableValue<MappableMixin.Instance[]>;

  @observable
  viewerMode: ViewerMode | undefined = ViewerMode.Cesium;

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

  constructor(terria: Terria, items: IComputedValue<MappableMixin.Instance[]>) {
    this.terria = terria;
    this.items = items;
  }

  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  private _lastViewer: GlobeOrMap | undefined;

  @computed({
    keepAlive: true
  })
  get currentViewer(): GlobeOrMap {
    // Use untracked on everything to ensure the viewer isn't recreated
    //  except when the viewer is required to change, the currently required
    //  viewer class finishes loading from an async chunk or the map container
    //  is changed

    const currentView = untracked(() => this.destroyCurrentViewer());

    let newViewer: GlobeOrMap;
    if (this.attached && this.viewerMode === ViewerMode.Leaflet) {
      const LeafletOrNoViewer = this._getLeafletIfLoaded();
      newViewer = untracked(
        () => new LeafletOrNoViewer(this, this.mapContainer!)
      );
    } else if (this.attached && this.viewerMode === ViewerMode.Cesium) {
      const CesiumOrNoViewer = this._getCesiumIfLoaded();
      newViewer = untracked(
        () => new CesiumOrNoViewer(this, this.mapContainer!)
      );
    } else {
      newViewer = untracked(() => new NoViewer(this));
    }

    console.log(`Creating a viewer: ${newViewer.type}`);
    this._lastViewer = newViewer;
    newViewer.zoomTo(currentView || untracked(() => this.homeCamera), 0.0);
    return newViewer;
  }

  @computed({
    keepAlive: true
  })
  private get _cesiumPromise() {
    return fromPromise(
      import("../Models/Cesium").then(Cesium => Cesium.default)
    );
  }

  private _getCesiumIfLoaded():
    | typeof import("../Models/Cesium").default
    | typeof NoViewer {
    if (this._cesiumPromise.state === FULFILLED) {
      return this._cesiumPromise.value;
    } else {
      // TODO: Handle error loading Cesium. What do you do if a bundle doesn't load?
      return NoViewer;
    }
  }

  @computed({
    keepAlive: true
  })
  private get _leafletPromise() {
    return fromPromise(
      import("../Models/Leaflet").then(Leaflet => Leaflet.default)
    );
  }

  private _getLeafletIfLoaded():
    | typeof import("../Models/Leaflet").default
    | typeof NoViewer {
    if (this._leafletPromise.state === FULFILLED) {
      return this._leafletPromise.value;
    } else {
      // TODO: Handle error loading Leaflet. What do you do if a bundle doesn't load?
      return NoViewer;
    }
  }

  // Pull out attaching logic into it's own step. This allows constructing a TerriaViewer
  // before its UI element is mounted in React to set basemap, items, viewermode
  @action
  attach(mapContainer?: string | HTMLElement) {
    this.mapContainer = mapContainer;
  }

  @action
  detach() {
    // Detach from a container
    this.mapContainer = undefined;
    this.destroyCurrentViewer();
  }

  destroy() {
    this.detach();
  }

  private destroyCurrentViewer() {
    let currentView: CameraView | undefined;
    if (this._lastViewer !== undefined) {
      console.log(`Destroying viewer: ${this._lastViewer.type}`);
      currentView = this._lastViewer.getCurrentCameraView();
      this._lastViewer.destroy();
      this._lastViewer = undefined;
    }
    return currentView;
  }
}
