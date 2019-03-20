import BoundingSphere from 'terriajs-cesium/Source/Core/BoundingSphere';
import BoundingSphereState from 'terriajs-cesium/Source/DataSources/BoundingSphereState';
import DataSource from 'terriajs-cesium/Source/DataSources/DataSource';
import HeadingPitchRange from 'terriajs-cesium/Source/Core/HeadingPitchRange';
import Terria from './Terria';
import Scene from 'terriajs-cesium/Source/Scene/Scene';
import Viewer from 'terriajs-cesium/Source/Widgets/Viewer/Viewer';
import GlobeOrMap, { CameraView } from './GlobeOrMap';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import Mappable, { ImageryParts } from './Mappable';
import sampleTerrain from 'terriajs-cesium/Source/Core/sampleTerrain';
import ImageryLayer from 'terriajs-cesium/Source/Scene/ImageryLayer';
import { createTransformer } from 'mobx-utils';
import { autorun } from 'mobx';
import pollToPromise from '../Core/pollToPromise';

/*global require*/
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('../Core/loadWithXhr');
var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
var SceneTransforms = require('terriajs-cesium/Source/Scene/SceneTransforms');
var ScreenSpaceEventType = require('terriajs-cesium/Source/Core/ScreenSpaceEventType');
var TaskProcessor = require('terriajs-cesium/Source/Core/TaskProcessor');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var EventHelper = require('terriajs-cesium/Source/Core/EventHelper');
var ImagerySplitDirection = require('terriajs-cesium/Source/Scene/ImagerySplitDirection');

var CesiumSelectionIndicator = require('../Map/CesiumSelectionIndicator');
var Feature = require('./Feature');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var PickedFeatures = require('../Map/PickedFeatures');
var ViewerMode = require('./ViewerMode');

function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

export default class Cesium implements GlobeOrMap {
    readonly terria: Terria;
    readonly viewer: Viewer;
    readonly scene: Scene;
    dataSourceDisplay: Cesium.DataSourceDisplay | undefined;
    private _disposeWorkbenchMapItemsSubscription: (() => void) | undefined;

    constructor(terria: Terria, viewer: Cesium.Viewer) {
        this.terria = terria;
        this.viewer = viewer;
        this.scene = viewer.scene;
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
                ...catalogItems.filter(isDefined).filter(Mappable.is).map(item => item.mapItems)
            );
            // TODO: Look up the type in a map and call the associated function.
            //       That way the supported types of map items is extensible.

            const allDataSources = allMapItems.filter(isDataSource);

            // Remove deleted data sources
            let dataSources = this.terria.dataSources;
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
            throw new DeveloperError("viewOrExtent is required.");
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
                        var finalDestinationCartographic = {
                            longitude: destination.longitude,
                            latitude: destination.latitude,
                            height: destination.height + results[0].height
                        };

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
                // that.notifyRepaintRequired();
            });
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
