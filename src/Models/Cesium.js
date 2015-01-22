'use strict';

/*global require*/
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var getTimestamp = require('../../third_party/cesium/Source/Core/getTimestamp');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var Cesium = function(application, viewer) {
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

    this._lastClockTime = new JulianDate(0, 0.0);
    this._lastCameraViewMatrix = new Matrix4();
    this._lastCameraMoveTime = 0;

    this._removePostRenderListener = this.scene.postRender.addEventListener(postRender.bind(undefined, this));
    this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

    // Force a repaint when the mouse moves or the window changes size.
    this.viewer.canvas.addEventListener('mousemove', this._boundNotifyRepaintRequired, false);
    window.addEventListener('resize', this._boundNotifyRepaintRequired, false);
};

Cesium.prototype.destroy = function() {
    if (defined(this._removePostRenderListener)) {
        this._removePostRenderListener();
        this._removePostRenderListener = undefined;
    }

    this.viewer.canvas.removeEventListener('mousemove', this._boundNotifyRepaintRequired, false);
    window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

    return destroyObject(this);
};

var cartesian3Scratch = new Cartesian3();

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
Cesium.prototype.getCurrentExtent = function() {
    var scene = this.scene;

    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;

    var centerOfScreen = new Cartesian2(width / 2.0, height / 2.0);
    var pickRay = scene.camera.getPickRay(centerOfScreen);
    var focus = scene.globe.pick(pickRay, scene);

    var focusCartographic = Ellipsoid.WGS84.cartesianToCartographic(focus);

    var distance = Cartesian3.magnitude(Cartesian3.subtract(focus, scene.camera.position, cartesian3Scratch));
    var offset = CesiumMath.toRadians(distance * 2.5e-6);

    var longitude = focusCartographic.longitude;
    var latitude = focusCartographic.latitude;
    return new Rectangle(longitude - offset, latitude - offset, longitude + offset, latitude + offset);
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
    }

    Matrix4.clone(scene.camera.viewMatrix, cesium._lastCameraViewMatrix);
}

module.exports = Cesium;
