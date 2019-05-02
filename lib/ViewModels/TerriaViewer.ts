import Terria from "../Models/Terria";
import { observable, computed, autorun, runInAction, action, reaction } from "mobx";
import GlobeOrMap from "../Models/GlobeOrMap";
import Leaflet from "../Models/Leaflet";
import Cesium from "../Models/Cesium";
import { createTransformer } from "mobx-utils";

// A class that deals with initialising, destroying and switching between viewers
// Each map-view should have it's own TerriaViewer

// Each viewer has it's own options
interface ViewerOptions {
    [key: string]: string | number | undefined;
}

function createViewer(terriaViewer: TerriaViewer, viewerMode: string): GlobeOrMap | undefined {
    console.log(`Creating a viewer: ${terriaViewer}`);
    if (terriaViewer.currentViewer !== undefined) {
        // Get viewer parameters to apply to new viewer
        // terriaViewer.currentViewer.getCamera...

        terriaViewer.currentViewer.destroy();
    }
    if (viewerMode === 'leaflet') {
        return new Leaflet(terriaViewer);
    }
    // } else if (viewerMode === 'cesium') {
    //     return new Cesium(terriaViewer);
    // }

    // Apply previous
}

export default class TerriaViewer {
    readonly terria: Terria;
    readonly container: string | HTMLElement;
    readonly createViewer: (viewerMode: string) => GlobeOrMap | undefined;
    readonly stopViewerAutorun: () => void;

    @observable
    baseMap: undefined; // Wire up base maps

    @observable
    viewerMode: string | undefined;

    @observable
    currentViewer: GlobeOrMap | undefined;

    constructor(terria: Terria) {
        this.terria = terria;
        this.container = 'cesiumContainer';
        this.createViewer = createTransformer((viewerMode) => createViewer(this, viewerMode));

        this.stopViewerAutorun = reaction(() => this.viewerMode, (viewerMode) => {
            const newViewer = viewerMode !== undefined ? this.createViewer(viewerMode) : undefined;
            runInAction(() => {
                this.currentViewer = newViewer;
            });
        });

        this.viewerMode = 'leaflet';
    }

    @computed
    get renderer() {
        return createViewer
    }
}
