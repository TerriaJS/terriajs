'use strict';

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
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var SceneTransforms = require('terriajs-cesium/Source/Scene/SceneTransforms');
var ScreenSpaceEventType = require('terriajs-cesium/Source/Core/ScreenSpaceEventType');
var TaskProcessor = require('terriajs-cesium/Source/Core/TaskProcessor');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CesiumSelectionIndicator = require('../Map/CesiumSelectionIndicator');
var GlobeOrMap = require('./GlobeOrMap');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');
var PickedFeatures = require('../Map/PickedFeatures');
var ViewerMode = require('./ViewerMode');

/**
 * The Cesium viewer component
 *
 * @alias Cesium
 * @constructor
 * @extends GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 * @param {Viewer} viewer The Cesium viewer instance.
 */
var Cesium = function(terria, viewer) {
    GlobeOrMap.call(this);

    /**
     * Gets or sets the Terria instance.
     * @type {Terria}
     */
    this.terria = terria;

    /**
     * Gets or sets the Cesium {@link Viewer} instance.
     * @type {Viewer}
     */
    this.viewer = viewer;

    /**
     * Gets or sets the Cesium {@link Scene} instance.
     * @type {Scene}
     */
    this.scene = viewer.scene;

    /**
     * Gets or sets whether the viewer has stopped rendering since startup or last set to false.
     * @type {Boolean}
     */
    this.stoppedRendering = false;

    /**
     * Gets or sets whether to output info to the console when starting and stopping rendering loop.
     * @type {Boolean}
     */
    this.verboseRendering = false;

    this._lastClockTime = new JulianDate(0, 0.0);
    this._lastCameraViewMatrix = new Matrix4();
    this._lastCameraMoveTime = 0;

    this._selectionIndicator = new CesiumSelectionIndicator(this);

    this._removePostRenderListener = this.scene.postRender.addEventListener(postRender.bind(undefined, this));
    this._removeInfoBoxCloseListener = undefined;
    this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

    // Handle left click by picking objects from the map.
    viewer.screenSpaceEventHandler.setInputAction(pickObject.bind(undefined, this), ScreenSpaceEventType.LEFT_CLICK);

    // Force a repaint when the mouse moves or the window changes size.
    var canvas = this.viewer.canvas;
    canvas.addEventListener('mousemove', this._boundNotifyRepaintRequired, false);
    canvas.addEventListener('mousedown', this._boundNotifyRepaintRequired, false);
    canvas.addEventListener('mouseup', this._boundNotifyRepaintRequired, false);
    canvas.addEventListener('touchstart', this._boundNotifyRepaintRequired, false);
    canvas.addEventListener('touchend', this._boundNotifyRepaintRequired, false);
    canvas.addEventListener('touchmove', this._boundNotifyRepaintRequired, false);

    if (defined(window.PointerEvent)) {
        canvas.addEventListener('pointerdown', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('pointerup', this._boundNotifyRepaintRequired, false);
        canvas.addEventListener('pointermove', this._boundNotifyRepaintRequired, false);
    }

    // Detect available wheel event
    this._wheelEvent = undefined;
    if ('onwheel' in canvas) {
        // spec event type
        this._wheelEvent = 'wheel';
    } else if (defined(document.onmousewheel)) {
        // legacy event type
        this._wheelEvent = 'mousewheel';
    } else {
        // older Firefox
        this._wheelEvent = 'DOMMouseScroll';
    }

    canvas.addEventListener(this._wheelEvent, this._boundNotifyRepaintRequired, false);

    window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

    // Force a repaint when the feature info box is closed.  Cesium can't close its info box
    // when the clock is not ticking, for reasons that are not clear.
    if (defined(this.viewer.infoBox)) {
        this._removeInfoBoxCloseListener = this.viewer.infoBox.viewModel.closeClicked.addEventListener(this._boundNotifyRepaintRequired);
    }

    if (defined(this.viewer._clockViewModel)) {
        var clock = this.viewer._clockViewModel;
        this._shouldAnimateSubscription = knockout.getObservable(clock, 'shouldAnimate').subscribe(this._boundNotifyRepaintRequired);
        this._currentTimeSubscription = knockout.getObservable(clock, 'currentTime').subscribe(this._boundNotifyRepaintRequired);
    }

    if (defined(this.viewer.timeline)) {
        this.viewer.timeline.addEventListener('settime', this._boundNotifyRepaintRequired, false);
    }

    this._selectedFeatureSubscription = knockout.getObservable( this.terria, 'selectedFeature').subscribe(function() {
        selectFeature(this);
    }, this);

    // Hacky way to force a repaint when an async load request completes
    var that = this;
    this._originalLoadWithXhr = loadWithXhr.load;
    loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
        deferred.promise.always(that._boundNotifyRepaintRequired);
        that._originalLoadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout);
    };

    // Hacky way to force a repaint when a web worker sends something back.
    this._originalScheduleTask = TaskProcessor.prototype.scheduleTask;
    TaskProcessor.prototype.scheduleTask = function(parameters, transferableObjects) {
        var result = that._originalScheduleTask.call(this, parameters, transferableObjects);

        if (!defined(this._originalWorkerMessageSinkRepaint)) {
            this._originalWorkerMessageSinkRepaint = this._worker.onmessage;

            var taskProcessor = this;
            this._worker.onmessage = function(event) {
                taskProcessor._originalWorkerMessageSinkRepaint(event);

                if (that.isDestroyed()) {
                    taskProcessor._worker.onmessage = taskProcessor._originalWorkerMessageSinkRepaint;
                    taskProcessor._originalWorkerMessageSinkRepaint = undefined;
                } else {
                    that.notifyRepaintRequired();
                }
            };
        }

        return result;
    };

    // If the render loop crashes, inform the user and then switch to 2D.
    this.scene.renderError.addEventListener(function(scene, error) {
         this.terria.error.raiseEvent(new ModelError({
            sender: this,
            title: 'Error rendering in 3D',
            message: '\
<p>An error occurred while rendering in 3D.  This probably indicates a bug in '+terria.appName+' or an incompatibility with your system \
or web browser.  We\'ll now switch you to 2D so that you can continue your work.  We would appreciate it if you report this \
error by sending an email to <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a> with the \
technical details below.  Thank you!</p><pre>' + formatError(error) + '</pre>'
        }));

         this.terria.viewerMode = ViewerMode.Leaflet;
    }, this);
};

inherit(GlobeOrMap, Cesium);

Cesium.prototype.destroy = function() {
    if (defined(this._selectionIndicator)) {
        this._selectionIndicator.destroy();
        this._selectionIndicator = undefined;
    }

    if (defined(this._removePostRenderListener)) {
        this._removePostRenderListener();
        this._removePostRenderListener = undefined;
    }

    if (defined(this._removeInfoBoxCloseListener)) {
        this._removeInfoBoxCloseListener();
    }

    if (defined(this._shouldAnimateSubscription)) {
        this._shouldAnimateSubscription.dispose();
        this._shouldAnimateSubscription = undefined;
    }

    if (defined(this._currentTimeSubscription)) {
        this._currentTimeSubscription.dispose();
        this._currentTimeSubscription = undefined;
    }

    if (defined(this.viewer.timeline)) {
        this.viewer.timeline.removeEventListener('settime', this._boundNotifyRepaintRequired, false);
    }

    if (defined(this._selectedFeatureSubscription)) {
        this._selectedFeatureSubscription.dispose();
        this._selectedFeatureSubscription = undefined;
    }

    this.viewer.canvas.removeEventListener('mousemove', this._boundNotifyRepaintRequired, false);
    this.viewer.canvas.removeEventListener('mousedown', this._boundNotifyRepaintRequired, false);
    this.viewer.canvas.removeEventListener('mouseup', this._boundNotifyRepaintRequired, false);
    this.viewer.canvas.removeEventListener('touchstart', this._boundNotifyRepaintRequired, false);
    this.viewer.canvas.removeEventListener('touchend', this._boundNotifyRepaintRequired, false);
    this.viewer.canvas.removeEventListener('touchmove', this._boundNotifyRepaintRequired, false);

    if (defined(window.PointerEvent)) {
        this.viewer.canvas.removeEventListener('pointerdown', this._boundNotifyRepaintRequired, false);
        this.viewer.canvas.removeEventListener('pointerup', this._boundNotifyRepaintRequired, false);
        this.viewer.canvas.removeEventListener('pointermove', this._boundNotifyRepaintRequired, false);
    }

    this.viewer.canvas.removeEventListener(this._wheelEvent, this._boundNotifyRepaintRequired, false);

    window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

    loadWithXhr.load = this._originalLoadWithXhr;
    TaskProcessor.prototype.scheduleTask = this._originalScheduleTask;

    return destroyObject(this);
};

Cesium.prototype.isDestroyed = function() {
    return false;
};

var cartesian3Scratch = new Cartesian3();
var enuToFixedScratch = new Matrix4();
var southwestScratch = new Cartesian3();
var southeastScratch = new Cartesian3();
var northeastScratch = new Cartesian3();
var northwestScratch = new Cartesian3();
var southwestCartographicScratch = new Cartographic();
var southeastCartographicScratch = new Cartographic();
var northeastCartographicScratch = new Cartographic();
var northwestCartographicScratch = new Cartographic();

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
Cesium.prototype.getCurrentExtent = function() {
    var scene = this.scene;
    var camera = scene.camera;

    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;

    var centerOfScreen = new Cartesian2(width / 2.0, height / 2.0);
    var pickRay = scene.camera.getPickRay(centerOfScreen);
    var center = scene.globe.pick(pickRay, scene);

    if (!defined(center)) {
        // TODO: binary search to find the horizon point and use that as the center.
        return  this.terria.homeView.rectangle;
    }

    var ellipsoid = this.scene.globe.ellipsoid;

    var fovy = scene.camera.frustum.fovy * 0.5;
    var fovx = Math.atan(Math.tan(fovy) * scene.camera.frustum.aspectRatio);

    var cameraOffset = Cartesian3.subtract(camera.positionWC, center, cartesian3Scratch);
    var cameraHeight = Cartesian3.magnitude(cameraOffset);
    var xDistance = cameraHeight * Math.tan(fovx);
    var yDistance = cameraHeight * Math.tan(fovy);

    var southwestEnu = new Cartesian3(-xDistance, -yDistance, 0.0);
    var southeastEnu = new Cartesian3(xDistance, -yDistance, 0.0);
    var northeastEnu = new Cartesian3(xDistance, yDistance, 0.0);
    var northwestEnu = new Cartesian3(-xDistance, yDistance, 0.0);

    var enuToFixed = Transforms.eastNorthUpToFixedFrame(center, ellipsoid, enuToFixedScratch);
    var southwest = Matrix4.multiplyByPoint(enuToFixed, southwestEnu, southwestScratch);
    var southeast = Matrix4.multiplyByPoint(enuToFixed, southeastEnu, southeastScratch);
    var northeast = Matrix4.multiplyByPoint(enuToFixed, northeastEnu, northeastScratch);
    var northwest = Matrix4.multiplyByPoint(enuToFixed, northwestEnu, northwestScratch);

    var southwestCartographic = ellipsoid.cartesianToCartographic(southwest, southwestCartographicScratch);
    var southeastCartographic = ellipsoid.cartesianToCartographic(southeast, southeastCartographicScratch);
    var northeastCartographic = ellipsoid.cartesianToCartographic(northeast, northeastCartographicScratch);
    var northwestCartographic = ellipsoid.cartesianToCartographic(northwest, northwestCartographicScratch);

    // Account for date-line wrapping
    if (southeastCartographic.longitude < southwestCartographic.longitude) {
        southeastCartographic.longitude += CesiumMath.TWO_PI;
    }
    if (northeastCartographic.longitude < northwestCartographic.longitude) {
        northeastCartographic.longitude += CesiumMath.TWO_PI;
    }

    var rect = new Rectangle(
        CesiumMath.convertLongitudeRange(Math.min(southwestCartographic.longitude, northwestCartographic.longitude)),
        Math.min(southwestCartographic.latitude, southeastCartographic.latitude),
        CesiumMath.convertLongitudeRange(Math.max(northeastCartographic.longitude, southeastCartographic.longitude)),
        Math.max(northeastCartographic.latitude, northwestCartographic.latitude));
    rect.center = center;
    return rect;
};

/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
Cesium.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
    if (!defined(viewOrExtent)) {
        throw new DeveloperError('viewOrExtent is required.');
    }

    flightDurationSeconds = defaultValue(flightDurationSeconds, 3.0);

    if (viewOrExtent instanceof Rectangle) {
        this.scene.camera.flyTo({
            duration: flightDurationSeconds,
            destination: viewOrExtent
        });
    } else if (defined(viewOrExtent.position)) {
        this.scene.camera.flyTo({
            duration: flightDurationSeconds,
            destination: viewOrExtent.position,
            orientation: {
                direction: viewOrExtent.direction,
                up: viewOrExtent.up
            }
        });
    } else {
        this.scene.camera.flyTo({
            duration: flightDurationSeconds,
            destination: viewOrExtent.rectangle
        });
    }

    this.notifyRepaintRequired();
};

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
Cesium.prototype.captureScreenshot = function() {
    var deferred = when.defer();

    var removeCallback = this.scene.postRender.addEventListener(function() {
        removeCallback();
        try {
            deferred.resolve(this.scene.canvas.toDataURL('image/jpeg'));
        } catch (e) {
            deferred.reject(e);
        }
    }, this);

    this.notifyRepaintRequired();

    return deferred.promise;
};

/**
 * Notifies the viewer that a repaint is required.
 */
Cesium.prototype.notifyRepaintRequired = function() {
    if (this.verboseRendering && !this.viewer.useDefaultRenderLoop) {
        console.log('starting rendering @ ' + getTimestamp());
    }
    this._lastCameraMoveTime = getTimestamp();
    this.viewer.useDefaultRenderLoop = true;
};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
Cesium.prototype.computePositionOnScreen = function(position, result) {
    return SceneTransforms.wgs84ToWindowCoordinates(this.scene, position, result);
};

function postRender(cesium, date) {
    // We can safely stop rendering when:
    //  - the camera position hasn't changed in over a second,
    //  - there are no tiles waiting to load, and
    //  - the clock is not animating
    //  - there are no tweens in progress

    var now = getTimestamp();

    var scene = cesium.scene;

    if (!Matrix4.equalsEpsilon(cesium._lastCameraViewMatrix, scene.camera.viewMatrix, 1e-5)) {
        cesium._lastCameraMoveTime = now;
    }

    var cameraMovedInLastSecond = now - cesium._lastCameraMoveTime < 1000;

    var surface = scene.globe._surface;
    var tilesWaiting = !surface._tileProvider.ready || surface._tileLoadQueue.length > 0 || surface._debug.tilesWaitingForChildren > 0;

    if (!cameraMovedInLastSecond && !tilesWaiting && !cesium.viewer.clock.shouldAnimate && cesium.scene.tweens.length === 0) {
        if (cesium.verboseRendering) {
            console.log('stopping rendering @ ' + getTimestamp());
        }
        cesium.viewer.useDefaultRenderLoop = false;
        cesium.stoppedRendering = true;
    }

    Matrix4.clone(scene.camera.viewMatrix, cesium._lastCameraViewMatrix);

    var feature = cesium.terria.selectedFeature;
    if (defined(feature) && defined(feature.position)) {
        cesium._selectionIndicator.position = feature.position.getValue(cesium.terria.clock.currentTime);
    }
    cesium._selectionIndicator.update();
}

function pickObject(cesium, e) {
    var pickRay = cesium.scene.camera.getPickRay(e.position);
    var pickPosition = cesium.scene.globe.pick(pickRay, cesium.scene);
    var pickPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(pickPosition);

    var result = new PickedFeatures();
    result.pickPosition = pickPosition;

    // Pick vector features.
    var picked = cesium.scene.drillPick(e.position);
    for (var i = 0; i < picked.length; ++i) {
        var id = picked[i].id;
        if (!defined(id) && defined(picked[i].primitive)) {
            id = picked[i].primitive.id;
        }
        if (id instanceof Entity) {
            result.features.push(id);
        }
    }

    // Pick raster features
    var promise = cesium.scene.imageryLayers.pickImageryLayerFeatures(pickRay, cesium.scene);

    result.allFeaturesAvailablePromise = when(promise, function(features) {
        result.isLoading = false;

        if (!defined(features)) {
            return;
        }

        for (var i = 0; i < features.length; ++i) {
            var feature = features[i];

            // If the picked feature does not have a height, use the height of the picked location.
            // This at least avoids major parallax effects on the selection indicator.
            if (!defined(feature.position.height) || feature.position.height === 0.0) {
                feature.position.height = pickPositionCartographic.height;
            }

            result.features.push(cesium._createEntityFromImageryLayerFeature(feature));
        }
    }).otherwise(function(e) {
        result.isLoading = false;
        result.error = 'An unknown error occurred while picking features.';
    });

    cesium.terria.pickedFeatures = result;
}

function selectFeature(cesium) {
    var feature = cesium.terria.selectedFeature;
    if (defined(feature) && defined(feature.position)) {
        cesium._selectionIndicator.position = feature.position.getValue(cesium.terria.clock.currentTime);
        cesium._selectionIndicator.animateAppear();
    } else {
        cesium._selectionIndicator.animateDepart();
    }
    cesium._selectionIndicator.update();
}

module.exports = Cesium;
