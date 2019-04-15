import { autorun } from 'mobx';
import { createTransformer } from 'mobx-utils';
import BoundingSphere from 'terriajs-cesium/Source/Core/BoundingSphere';
import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import getTimestamp from 'terriajs-cesium/Source/Core/getTimestamp';
import HeadingPitchRange from 'terriajs-cesium/Source/Core/HeadingPitchRange';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import Matrix4 from 'terriajs-cesium/Source/Core/Matrix4';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import sampleTerrain from 'terriajs-cesium/Source/Core/sampleTerrain';
import BoundingSphereState from 'terriajs-cesium/Source/DataSources/BoundingSphereState';
import DataSource from 'terriajs-cesium/Source/DataSources/DataSource';
import DataSourceCollection from "terriajs-cesium/Source/DataSources/DataSourceCollection";
import ImageryLayer from 'terriajs-cesium/Source/Scene/ImageryLayer';
import Scene from 'terriajs-cesium/Source/Scene/Scene';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import Viewer from 'terriajs-cesium/Source/Widgets/Viewer/Viewer';
import isDefined from '../Core/isDefined';
import pollToPromise from '../Core/pollToPromise';
import GlobeOrMap, { CameraView } from './GlobeOrMap';
import Mappable, { ImageryParts } from './Mappable';
import Terria from './Terria';
import CesiumEvent from 'terriajs-cesium/Source/Core/Event';

export default class Cesium implements GlobeOrMap {
    readonly terria: Terria;
    readonly viewer: Viewer;
    readonly scene: Scene;
    readonly dataSources: DataSourceCollection = new DataSourceCollection();
    dataSourceDisplay: Cesium.DataSourceDisplay | undefined;

    /**
     * Gets or sets whether to output info to the console when starting and stopping rendering loop.
     * @type {boolean}
     */
    verboseRendering = false;

    /**
     * Gets or sets whether the viewer has stopped rendering since startup or last set to false.
     * @type {boolean}
     */
    stoppedRendering = false;

    private _disposeWorkbenchMapItemsSubscription: (() => void) | undefined;
    private _boundNotifyRepaintRequired: (() => void) | undefined;
    private _wheelEvent: string | undefined;
    private _removePostRenderListener: CesiumEvent.RemoveCallback | undefined;
    private _lastCameraViewMatrix = new Matrix4();
    private _lastCameraMoveTime: number = -Number.MAX_VALUE;

    constructor(terria: Terria, viewer: Cesium.Viewer) {
        this.terria = terria;
        this.viewer = viewer;
        this.scene = viewer.scene;

        this._removePostRenderListener = this.scene.postRender.addEventListener(this.postRender.bind(this));

        this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);
        var canvas = this.viewer.canvas;
        canvas.addEventListener('mousemove', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('mousedown', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('mouseup', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('touchstart', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('touchend', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('touchmove', this._boundNotifyRepaintRequired, false);

        if (defined(globalThis.PointerEvent)) {
            canvas.addEventListener('pointerdown', this._boundNotifyRepaintRequired, false);
            canvas.addEventListener('pointerup', this._boundNotifyRepaintRequired, false);
            canvas.addEventListener('pointermove', this._boundNotifyRepaintRequired, false);
        }

        // Detect available wheel event
        this._wheelEvent = undefined;
        if ('onwheel' in canvas) {
            // spec event type
            this._wheelEvent = 'wheel';
        } else if (defined(globalThis.onmousewheel)) {
            // legacy event type
            this._wheelEvent = 'mousewheel';
        } else {
            // older Firefox
            this._wheelEvent = 'DOMMouseScroll';
        }

        canvas.addEventListener(this._wheelEvent, this._boundNotifyRepaintRequired, false);

        window.addEventListener('resize', this._boundNotifyRepaintRequired, false);
    }

    destroy() {
        if (this._removePostRenderListener) {
            this._removePostRenderListener();
        }

        if (this._boundNotifyRepaintRequired) {
            this.viewer.canvas.removeEventListener('mousemove', this._boundNotifyRepaintRequired, false);
            this.viewer.canvas.removeEventListener('mousedown', this._boundNotifyRepaintRequired, false);
            this.viewer.canvas.removeEventListener('mouseup', this._boundNotifyRepaintRequired, false);
            this.viewer.canvas.removeEventListener('touchstart', this._boundNotifyRepaintRequired, false);
            this.viewer.canvas.removeEventListener('touchend', this._boundNotifyRepaintRequired, false);
            this.viewer.canvas.removeEventListener('touchmove', this._boundNotifyRepaintRequired, false);

            if (defined(globalThis.PointerEvent)) {
                this.viewer.canvas.removeEventListener('pointerdown', this._boundNotifyRepaintRequired, false);
                this.viewer.canvas.removeEventListener('pointerup', this._boundNotifyRepaintRequired, false);
                this.viewer.canvas.removeEventListener('pointermove', this._boundNotifyRepaintRequired, false);
            }

            if (this._wheelEvent) {
                this.viewer.canvas.removeEventListener(this._wheelEvent, this._boundNotifyRepaintRequired, false);
            }

            window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);
        }

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
                ...catalogItems.filter(isDefined).filter(Mappable.is).map(item => item.mapItems)
            );
            // TODO: Look up the type in a map and call the associated function.
            //       That way the supported types of map items is extensible.

            const allDataSources = allMapItems.filter(isDataSource);

            // Remove deleted data sources
            let dataSources = this.dataSources;
            for (let i = 0; i < dataSources.length; i++) {
                const d = dataSources.get(i);
                if (allDataSources.indexOf(d) === -1) {
                    dataSources.remove(d);
                }
            }

            // Add new data sources
            allDataSources.forEach(d => {
                if (!dataSources.contains(d)) {
                    dataSources.add(d);
                }
            });

            // This is the Cesium ImageryLayer, not our Typescript one
            const allImageryParts = allMapItems
                .filter(ImageryParts.is)
                .map(
                    makeImageryLayerFromParts
                );

            // Delete imagery layers that are no longer in the model
            for (let i = 0; i < this.scene.imageryLayers.length; i++) {
                const imageryLayer = this.scene.imageryLayers.get(i);
                if (allImageryParts.indexOf(imageryLayer) === -1) {
                    this.scene.imageryLayers.remove(imageryLayer);
                }
            }
            // Iterate backwards so that adding multiple layers adds them in increasing cesium index order
            for (let modelIndex = allImageryParts.length - 1; modelIndex >= 0; modelIndex--) {
                const mapItem = allImageryParts[modelIndex];

                const targetCesiumIndex = allImageryParts.length - modelIndex - 1;
                const currentCesiumIndex = this.scene.imageryLayers.indexOf(mapItem);
                if (currentCesiumIndex === -1) {
                    this.scene.imageryLayers.add(mapItem, targetCesiumIndex);
                } else if (currentCesiumIndex > targetCesiumIndex) {
                    for (let j = currentCesiumIndex; j > targetCesiumIndex; j--) {
                        this.scene.imageryLayers.lower(mapItem);
                    }
                } else if (currentCesiumIndex < targetCesiumIndex) {
                    for (let j = currentCesiumIndex; j < targetCesiumIndex; j++) {
                        this.scene.imageryLayers.raise(mapItem);
                    }
                }
            }

            this.notifyRepaintRequired();
        });
    }

    stopObserving() {
        if (this._disposeWorkbenchMapItemsSubscription !== undefined) {
            this._disposeWorkbenchMapItemsSubscription();
        }
    }

    zoomTo(
        target: CameraView | Cesium.Rectangle | Cesium.DataSource | /*TODO Cesium.Cesium3DTileset*/ any,
        flightDurationSeconds: number
    ): void {
        if (!defined(target)) {
            return;
            //throw new DeveloperError("viewOrExtent is required.");
        }

        flightDurationSeconds = defaultValue(flightDurationSeconds, 3.0);

        var that = this;

        return when()
            .then(function() {
                if (target instanceof Rectangle) {
                    var camera = that.scene.camera;

                    // Work out the destination that the camera would naturally fly to
                    var destinationCartesian = camera.getRectangleCameraCoordinates(
                        target
                    );
                    var destination = Ellipsoid.WGS84.cartesianToCartographic(
                        destinationCartesian
                    );
                    var terrainProvider = that.scene.globe.terrainProvider;
                    var level = 6; // A sufficiently coarse tile level that still has approximately accurate height
                    var positions = [Rectangle.center(target)];

                    // Perform an elevation query at the centre of the rectangle
                    return sampleTerrain(
                        terrainProvider,
                        level,
                        positions
                    ).then(function(results) {
                        var finalDestinationCartographic = new Cartographic(
                            destination.longitude,
                            destination.latitude,
                            destination.height + results[0].height
                        );

                        var finalDestination = Ellipsoid.WGS84.cartographicToCartesian(
                            finalDestinationCartographic
                        );

                        camera.flyTo({
                            duration: flightDurationSeconds,
                            destination: finalDestination
                        });
                    });
                } else if (defined(target.entities)) {
                    // Zooming to a DataSource
                    if (target.isLoading && defined(target.loadingEvent)) {
                        var deferred = when.defer();
                        var removeEvent = target.loadingEvent.addEventListener(function() {
                            removeEvent();
                            deferred.resolve();
                        });
                        return deferred.promise.then(function() {
                            return zoomToDataSource(that, target, flightDurationSeconds);
                        });
                    }
                    return zoomToDataSource(that, target);
                } else if (defined(target.readyPromise)) {
                    return target.readyPromise.then(function() {
                        if (defined(target.boundingSphere)) {
                            zoomToBoundingSphere(that, target, flightDurationSeconds);
                        }
                    });
                } else if (defined(target.boundingSphere)) {
                    return zoomToBoundingSphere(that, target);
                } else if (target.position !== undefined) {
                    that.scene.camera.flyTo({
                        duration: flightDurationSeconds,
                        destination: target.position,
                        orientation: {
                            direction: target.direction,
                            up: target.up
                        }
                    });
                } else {
                    that.scene.camera.flyTo({
                        duration: flightDurationSeconds,
                        destination: target.rectangle
                    });
                }
            })
            .then(function() {
                that.notifyRepaintRequired();
            });
    }

    notifyRepaintRequired() {
        if (this.verboseRendering && !this.viewer.useDefaultRenderLoop) {
            console.log('starting rendering @ ' + getTimestamp());
        }
        this._lastCameraMoveTime = getTimestamp();
        this.viewer.useDefaultRenderLoop = true;
    }

    private postRender(date: JulianDate) {
        // We can safely stop rendering when:
        //  - the camera position hasn't changed in over a second,
        //  - there are no tiles waiting to load, and
        //  - the clock is not animating
        //  - there are no tweens in progress

        const now = getTimestamp();

        const scene = this.scene;

        if (!Matrix4.equalsEpsilon(this._lastCameraViewMatrix, scene.camera.viewMatrix, 1e-5)) {
            this._lastCameraMoveTime = now;
        }

        const cameraMovedInLastSecond = now - this._lastCameraMoveTime < 1000;

        const surface = (<any>scene.globe)._surface;
        const terrainTilesWaiting = !surface._tileProvider.ready || surface._tileLoadQueueHigh.length > 0 || surface._tileLoadQueueMedium.length > 0 || surface._tileLoadQueueLow.length > 0 || surface._debug.tilesWaitingForChildren > 0;
        const tweens = (<any>scene).tweens;

        if (!cameraMovedInLastSecond && !terrainTilesWaiting && !this.viewer.clock.shouldAnimate && tweens.length === 0) {
            if (this.verboseRendering) {
                console.log('stopping rendering @ ' + getTimestamp());
            }
            this.viewer.useDefaultRenderLoop = false;
            this.stoppedRendering = true;
        }

        Matrix4.clone(scene.camera.viewMatrix, this._lastCameraViewMatrix);

        // TODO: re-add when selection indicator is added
        // var feature = this.terria.selectedFeature;
        // if (defined(feature) && defined(feature.position)) {
        //     this._selectionIndicator.position = feature.position.getValue(cesium.terria.clock.currentTime);
        // }
        // this._selectionIndicator.update();
    }
}

var boundingSphereScratch = new BoundingSphere();

function zoomToDataSource(
    cesium: Cesium,
    target: Cesium.DataSource,
    flightDurationSeconds?: number
): Promise<void> {
    return pollToPromise(function() {
        const dataSourceDisplay = cesium.dataSourceDisplay;
        if (dataSourceDisplay === undefined) {
            return false;
        }

        var entities = target.entities.values;

        var boundingSpheres = [];
        for (var i = 0, len = entities.length; i < len; i++) {
            var state = BoundingSphereState.PENDING;
            try {
                // TODO: missing Cesium type info
                state = (<any>dataSourceDisplay).getBoundingSphere(entities[i], false, boundingSphereScratch);
            } catch (e) {
            }

            if (state === BoundingSphereState.PENDING) {
                return false;
            } else if (state !== BoundingSphereState.FAILED) {
                boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
            }
        }

        var boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
        cesium.scene.camera.flyToBoundingSphere(boundingSphere, {
            duration : flightDurationSeconds
        });
        return true;
    }, {
        pollInterval: 100,
        timeout: 5000
    });
}

function zoomToBoundingSphere(
    cesium: Cesium,
    target: { boundingSphere: Cesium.BoundingSphere },
    flightDurationSeconds?: number
) {
    var boundingSphere = target.boundingSphere;
    cesium.scene.camera.flyToBoundingSphere(target.boundingSphere, {
        offset: new HeadingPitchRange(0.0, -0.5, boundingSphere.radius),
        duration: flightDurationSeconds
    });
}

const createImageryLayer: (ip: Cesium.ImageryProvider) => Cesium.ImageryLayer = createTransformer((ip: Cesium.ImageryProvider) => {
    console.log('Creating a new ImageryLayer');
    return new ImageryLayer(ip);
});

function makeImageryLayerFromParts(parts: ImageryParts): Cesium.ImageryLayer {
    const layer = createImageryLayer(parts.imageryProvider);

    layer.alpha = parts.alpha;
    layer.show = parts.show;
    return layer;
}

function isDataSource(object: DataSource | ImageryParts): object is DataSource {
    return "entities" in object;
}
