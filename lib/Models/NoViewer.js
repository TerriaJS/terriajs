"use strict";

/*global require*/
var GlobeOrMap = require("./GlobeOrMap");
var inherit = require("../Core/inherit");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

/**
 * The base class for map/globe viewers.
 *
 * @constructor
 * @alias GlobeOrMap
 *
 * @see Cesium
 * @see Leaflet
 */
var NoViewer = function(terria) {
  GlobeOrMap.call(this, terria);
};

inherit(GlobeOrMap, NoViewer);

NoViewer.prototype.destroy = function() {};

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
 * Gets the current container element.
 * @return {Element} The current container element.
 */
NoViewer.prototype.getContainer = function() {
  return undefined;
};

/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
NoViewer.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
  this.terria.initialView = viewOrExtent;
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
NoViewer.prototype.notifyRepaintRequired = function() {};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
NoViewer.prototype.computePositionOnScreen = function(position, result) {
  return undefined;
};

/**
 * Adds an attribution to the globe or map.
 * @param {Credit} attribution The attribution to add.
 */
NoViewer.prototype.addAttribution = function(attribution) {};

/**
 * Removes an attribution from the globe or map.
 * @param {Credit} attribution The attribution to remove.
 */
NoViewer.prototype.removeAttribution = function(attribution) {};

/**
 * Perform any updates to the order of layers required by raise and lower,
 * but after the items have been reordered.
 * This allows for the possibility that raise and lower do nothing, and instead we
 * call updateLayerOrder
 */
NoViewer.prototype.updateLayerOrderAfterReorder = function() {};

/**
 * Raise an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to raise
 */
NoViewer.prototype.raise = function(index) {};

/**
 * Lower an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to lower
 */
NoViewer.prototype.lower = function(index) {};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
NoViewer.prototype.lowerToBottom = function(item) {};

NoViewer.prototype.addImageryProvider = function(options) {};

NoViewer.prototype.removeImageryLayer = function(options) {};

NoViewer.prototype.showImageryLayer = function(options) {};

NoViewer.prototype.hideImageryLayer = function(options) {};

NoViewer.prototype.isImageryLayerShown = function(options) {
  return false;
};

module.exports = NoViewer;
