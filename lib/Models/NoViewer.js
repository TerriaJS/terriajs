'use strict';

/*global require*/
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * The base class for map/globe viewers.
 *
 * @constructor
 * @alias GlobeOrMap
 *
 * @see Cesium
 * @see Leaflet
 */
var NoViewer = function() {
};

NoViewer.prototype.destroy = function() {
};

NoViewer.prototype.isDestroyed = function() {
    return false;
};

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
NoViewer.prototype.getCurrentExtent = function() {
    return Rectangle.MAX_VALUE;
};

/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
NoViewer.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
};

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
NoViewer.prototype.captureScreenshot = function() {
    return when.reject();
};

/**
 * Notifies the viewer that a repaint is required.
 */
NoViewer.prototype.notifyRepaintRequired = function() {
};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
NoViewer.prototype.computePositionOnScreen = function(position, result) {
    return undefined;
};

module.exports = NoViewer;
