'use strict';

/*global require*/
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
require('./ImageryLayerFeatureInfo'); // overrides Cesium's prototype.configureDescriptionFromProperties

/**
 * The base class for map/globe viewers.
 *
 * @constructor
 * @alias GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 *
 * @see Cesium
 * @see Leaflet
 */
var GlobeOrMap = function(terria) {
    /**
     * Gets or sets the Terria instance.
     * @type {Terria}
     */
    this.terria = terria;

    this._tilesLoadingCountMax = 0;
};
/**
 * Creates an {@see Entity} from a {@see ImageryLayerFeatureInfo}.
 * @param {ImageryLayerFeatureInfo} feature The feature for which to create an entity.
 * @return {Entity} The created entity.
 * @protected
 */
GlobeOrMap.prototype._createEntityFromImageryLayerFeature = function(feature) {
    var entity = new Entity({
        id : feature.name
    });
    entity.name = feature.name;
    entity.description = feature.description;  // already defined by the new Entity

    if (entity.propertyNames.indexOf('properties') === -1) {  // not defined yet, but could be in future
        entity.addProperty('properties');
    }
    entity.properties = feature.properties;


    entity.imageryLayer = feature.imageryLayer;
    entity.position = Ellipsoid.WGS84.cartographicToCartesian(feature.position);
    entity.coords = feature.coords;

    return entity;
};

GlobeOrMap.prototype.updateTilesLoadingCount = function(tilesLoadingCount) {
    if (tilesLoadingCount > this._tilesLoadingCountMax) {
        this._tilesLoadingCountMax = tilesLoadingCount;
    } else if (tilesLoadingCount === 0) {
        this._tilesLoadingCountMax = 0;
    }

    this.terria.tileLoadProgressEvent.raiseEvent(tilesLoadingCount, this._tilesLoadingCountMax);
};

GlobeOrMap.prototype.isDestroyed = function() {
    return false;
};

GlobeOrMap.prototype.pickFromLocation = function(cartesian) {
    throw new DeveloperError('pickFromLocation must be implemented in the derived class.');
};

GlobeOrMap.prototype.destroy = function() {
    throw new DeveloperError('destroy must be implemented in the derived class.');
};

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
GlobeOrMap.prototype.getCurrentExtent = function() {
    throw new DeveloperError('getCurrentExtent must be implemented in the derived class.');
};

/**
 * Gets the current container element.
 * @return {Element} The current container element.
 */
GlobeOrMap.prototype.getContainer = function() {
    throw new DeveloperError('getContainer must be implemented in the derived class.');
};


/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
GlobeOrMap.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
    throw new DeveloperError('zoomTo must be implemented in the derived class.');
};

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
GlobeOrMap.prototype.captureScreenshot = function() {
    throw new DeveloperError('captureScreenshot must be implemented in the derived class.');
};

/**
 * Notifies the viewer that a repaint is required.
 */
GlobeOrMap.prototype.notifyRepaintRequired = function() {
    throw new DeveloperError('notifyRepaintRequired must be implemented in the derived class.');
};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
GlobeOrMap.prototype.computePositionOnScreen = function(position, result) {
    throw new DeveloperError('computePositionOnScreen must be implemented in the derived class.');
};

/**
 * Adds an attribution to the globe or map.
 * @param {Credit} attribution The attribution to add.
 */
GlobeOrMap.prototype.addAttribution = function(attribution) {
    throw new DeveloperError('addAttribution must be implemented in the derived class.');
};

/**
 * Removes an attribution from the globe or map.
 * @param {Credit} attribution The attribution to remove.
 */
GlobeOrMap.prototype.removeAttribution = function(attribution) {
    throw new DeveloperError('removeAttribution must be implemented in the derived class.');
};

/**
 * Perform any updates to the order of layers required by raise and lower,
 * but after the items have been reordered.
 * This allows for the possibility that raise and lower do nothing, and instead we
 * call updateLayerOrder
 */
GlobeOrMap.prototype.updateLayerOrderAfterReorder = function() {
    throw new DeveloperError('updateLayerOrderAfterReorder must be implemented in the derived class.');
};

/**
 * Raise an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to raise
 */
GlobeOrMap.prototype.raise = function(index) {
    throw new DeveloperError('raise must be implemented in the derived class.');
};

/**
 * Lower an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to lower
 */
GlobeOrMap.prototype.lower = function(index) {
    throw new DeveloperError('lower must be implemented in the derived class.');
};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
GlobeOrMap.prototype.lowerToBottom = function(item) {
    throw new DeveloperError('lowerToBottom must be implemented in the derived class.');
};

module.exports = GlobeOrMap;
