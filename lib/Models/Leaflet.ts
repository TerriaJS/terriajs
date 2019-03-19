import CesiumTileLayer from "../Map/CesiumTileLayer";
import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Mappable, { DataSource, ImageryParts } from "./Mappable";
import Terria from "./Terria";
import { autorun } from "mobx";
import { createTransformer } from "mobx-utils";

function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

export default class Leaflet implements GlobeOrMap {
    readonly terria: Terria;
    readonly map: L.Map;
    private _disposeWorkbenchMapItemsSubscription: (() => void) | undefined;

    constructor(terria: Terria, map: L.Map) {
        this.terria = terria;
        this.map = map;
    }

    destroy() {
        this.stopObserving();
    }

    observeModelLayer() {
        this._disposeWorkbenchMapItemsSubscription = autorun(() => {
            const catalogItems = [
                ...this.terria.workbench.items,
                this.terria.baseMap
            ];
            // Flatmap
            const allMapItems = ([] as (DataSource | ImageryParts)[]).concat(
                ...catalogItems
                    .filter(isDefined)
                    .filter(Mappable.is)
                    .map(item => item.mapItems)
            );

            const allImageryLayers = allMapItems
                .filter(ImageryParts.is)
                .map(parts => makeImageryLayerFromParts(parts, this.map));

            // Delete imagery layers no longer in the model
            this.map.eachLayer(layer => {
                const index = allImageryLayers.findIndex(l => l === layer);
                if (index === -1) {
                    this.map.removeLayer(layer);
                }
            });

            // Add layer and update its zIndex
            let zIndex = 100; // Start at an arbitrary value
            allImageryLayers.reverse().forEach(layer => {
                if (!this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                }
                layer.setZIndex(zIndex);
                zIndex++;
            });
        });
    }

    stopObserving() {
        if (this._disposeWorkbenchMapItemsSubscription !== undefined) {
            this._disposeWorkbenchMapItemsSubscription();
        }
    }

    zoomTo(
        viewOrExtent: CameraView | Cesium.Rectangle,
        flightDurationSeconds: number
    ): void {}
}

const createImageryLayer: (
    ip: Cesium.ImageryProvider
) => CesiumTileLayer = createTransformer((ip: Cesium.ImageryProvider) => {
    return new CesiumTileLayer(ip);
});

function makeImageryLayerFromParts(
    parts: ImageryParts,
    map: L.Map
): CesiumTileLayer {
    const layer = createImageryLayer(parts.imageryProvider);

    // react to show/hide and opacity changes
    autorun(() => {
        layer.setOpacity(parts.alpha);
        if (parts.show) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    });
    return layer;
}
