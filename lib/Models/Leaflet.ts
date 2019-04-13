import CesiumTileLayer from "../Map/CesiumTileLayer";
import GlobeOrMap, { CameraView } from "./GlobeOrMap";
import Mappable, { ImageryParts } from "./Mappable";
import Terria from "./Terria";
import { autorun } from "mobx";
import { createTransformer } from "mobx-utils";
import { DataSource } from "cesium";

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

            const allImagery = allMapItems
                .filter(ImageryParts.is)
                .map(parts => ({
                    parts: parts,
                    layer: createImageryLayer(parts.imageryProvider)
                }));

            // Delete imagery layers no longer in the model
            this.map.eachLayer(mapLayer => {
                const index = allImagery.findIndex(im => im.layer === mapLayer);
                if (index === -1) {
                    this.map.removeLayer(mapLayer);
                }
            });

            // Add layer and update its zIndex
            let zIndex = 100; // Start at an arbitrary value
            allImagery.reverse().forEach(({ parts, layer }) => {
                if (parts.show) {
                    layer.setOpacity(parts.alpha);
                    layer.setZIndex(zIndex);
                    zIndex++;

                    if (!this.map.hasLayer(layer)) {
                        this.map.addLayer(layer);
                    }
                } else {
                    this.map.removeLayer(layer);
                }
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
