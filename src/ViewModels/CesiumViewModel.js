'use strict';

/*global require*/
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');

var CesiumViewModel = function(application, viewer) {
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

/**
 * Zooms to a specified extent with a smooth flight animation.
 *
 * @param {Rectangle} extent The extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
CesiumViewModel.prototype.zoomTo = function(extent, flightDurationSeconds) {
    if (!defined(extent)) {
        throw new DeveloperError('extent is required.');
    }

    var flight = CameraFlightPath.createTweenRectangle(this.scene, {
        destination : extent,
        duration : defaultValue(flightDurationSeconds, 3.0)
    });
    this.scene.tweens.add(flight);
};

module.exports = CesiumViewModel;
