import { observable, reaction, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import GlobeOrMap from "../Models/GlobeOrMap";
import Leaflet from "../Models/Leaflet";
import Cesium from "../Models/Cesium";
import Terria from "../Models/Terria";

// A class that deals with initialising, destroying and switching between viewers
// Each map-view should have it's own TerriaViewer

// Each viewer has it's own options
// Extending from ViewerOptions is just to signify they should be serialisable
// Maybe this should have traits and strata?
// Probably. That could encode App defaults & user settings. Could be useuful if you want a reset button or similar
interface ViewerOptions {
  [key: string]: string | number | boolean | undefined;
}

interface CesiumOptions extends ViewerOptions {
  useTerrain: boolean;
}

interface LeafletOptions extends ViewerOptions {}

const cesiumDefaults: CesiumOptions = {
  useTerrain: true
};

export default class TerriaViewer {
  readonly terria: Terria;
  readonly container: string | HTMLElement;
  readonly stopViewerAutorun: () => void;

  @observable
  baseMap: undefined; // Wire up base maps

  @observable
  viewerMode: string | undefined = "cesium";

  @observable
  currentViewer: GlobeOrMap | undefined;

  // Set by UI
  @observable
  viewerOptions: { cesium: CesiumOptions; leaflet: LeafletOptions } = {
    cesium: cesiumDefaults,
    leaflet: {}
  };

  // Random rectangle. Work out reactivity
  defaultExtent: Rectangle = Rectangle.fromDegrees(120, -45, 155, -15);

  constructor(terria: Terria) {
    this.terria = terria;
    this.container = "cesiumContainer";
    this.stopViewerAutorun = reaction(
      () => this.viewerMode,
      viewerMode => {
        let bounds: Rectangle | undefined;
        if (this.currentViewer !== undefined) {
          // Get viewer parameters to apply to new viewer
          // terriaViewer.currentViewer.getCamera...
          bounds = this.currentViewer.getCurrentExtent();
          this.currentViewer.destroy();
        }
        const newViewer =
          viewerMode !== undefined ? this.createViewer(viewerMode) : undefined;
        // Apply previous parameters
        if (newViewer !== undefined) {
          newViewer.zoomTo(bounds || this.defaultExtent, 0.0);
        }
        runInAction(() => {
          this.currentViewer = newViewer;
        });
      },
      { fireImmediately: true }
    );
  }

  createViewer(viewerMode: string): GlobeOrMap | undefined {
    console.log(`Creating a viewer: ${viewerMode}`);

    if (viewerMode === "leaflet") {
      return new Leaflet(this);
    } else if (viewerMode === "cesium") {
      return new Cesium(this);
    }
  }
}
