'use strict';

/*global require*/
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
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

    return deferred.promise;
};

module.exports = Cesium;
