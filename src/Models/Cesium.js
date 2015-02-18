'use strict';

/*global require*/
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var Cartographic = require('../../third_party/cesium/Source/Core/Cartographic');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var formatError = require('../../third_party/cesium/Source/Core/formatError');
var getTimestamp = require('../../third_party/cesium/Source/Core/getTimestamp');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var TaskProcessor = require('../../third_party/cesium/Source/Core/TaskProcessor');
var Transforms = require('../../third_party/cesium/Source/Core/Transforms');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var ModelError = require('./ModelError');
var ViewerMode = require('./ViewerMode');

var Cesium = function(application, viewer) {
    /**
     * Gets or sets the application.
     * @type {Application}
     */
    this.application = application;

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
     * @type {Scene}
     */
    this.stoppedRendering = false;


    this._lastClockTime = new JulianDate(0, 0.0);
    this._lastCameraViewMatrix = new Matrix4();
    this._lastCameraMoveTime = 0;

    this._removePostRenderListener = this.scene.postRender.addEventListener(postRender.bind(undefined, this));
    this._removeInfoBoxCloseListener = undefined;
    this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

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

    // Hacky way to force a repaint when an async load request completes
    var that = this;
    this._originalLoadWithXhr = loadWithXhr.load;
    loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText) {
        deferred.promise.always(that._boundNotifyRepaintRequired);
        that._originalLoadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType, preferText);
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
        this.application.error.raiseEvent(new ModelError({
            sender: this,
            title: 'Error rendering in 3D',
            message: '\
<p>An error occurred while rendering in 3D.  This probably indicates a bug in National Map or an incompatibility with your system \
or web browser.  We\'ll now switch you to 2D so that you can continue your work.  We would appreciate it if you report this \
errror by sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> with the \
technical details below.  Thank you!</p><pre style="overflow:auto;margin-top:10px;padding:10px;border:1px solid gray;">' + formatError(error) + '</pre>'
        }));

        this.application.viewerMode = ViewerMode.Leaflet;
    }, this);
};

Cesium.prototype.destroy = function() {
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
        return this.application.initialBoundingBox;
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
 * Zooms to a specified extent with a smooth flight animation.
 *
 * @param {Rectangle} extent The extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
Cesium.prototype.zoomTo = function(extent, flightDurationSeconds) {
    if (!defined(extent)) {
        throw new DeveloperError('extent is required.');
    }

    var flight = CameraFlightPath.createTweenRectangle(this.scene, {
        destination : extent,
        duration : defaultValue(flightDurationSeconds, 3.0)
    });
    this.scene.tweens.add(flight);

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
    if (!this.viewer.useDefaultRenderLoop) {
        console.log('starting rendering @ ' + getTimestamp());
    }
    this._lastCameraMoveTime = getTimestamp();
    this.viewer.useDefaultRenderLoop = true;
};

function postRender(cesium, date) {
    // We can safely stop rendering when:
    //  - the camera position hasn't changed in over a second,
    //  - there are no tiles waiting to load, and
    //  - the clock is not animating

    var now = getTimestamp();

    var scene = cesium.scene;

    if (!Matrix4.equals(cesium._lastCameraViewMatrix, scene.camera.viewMatrix)) {
        cesium._lastCameraMoveTime = now;
    }

    var cameraMovedInLastSecond = now - cesium._lastCameraMoveTime < 1000;

    var surface = scene.globe._surface;
    var tilesWaiting = !surface._tileProvider.ready || surface._tileLoadQueue.length > 0 || surface._debug.tilesWaitingForChildren > 0;

    if (!cameraMovedInLastSecond && !tilesWaiting && !cesium.viewer.clock.shouldAnimate) {
        console.log('stopping rendering @ ' + getTimestamp());
        cesium.viewer.useDefaultRenderLoop = false;
        cesium.stoppedRendering = true;
    }

    Matrix4.clone(scene.camera.viewMatrix, cesium._lastCameraViewMatrix);
}

module.exports = Cesium;
