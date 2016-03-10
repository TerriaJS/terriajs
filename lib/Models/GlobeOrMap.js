'use strict';

/*global require*/
var Color = require('terriajs-cesium/Source/Core/Color');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var featureDataToGeoJson = require('../Map/featureDataToGeoJson');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
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
    this._removeHighlightCallback = undefined;
    this._highlightPromise = undefined;
};
/**
 * Creates an {@see Entity} from a {@see ImageryLayerFeatureInfo}.
 * @param {ImageryLayerFeatureInfo} feature The feature for which to create an entity.
 * @return {Entity} The created entity.
 * @protected
 */
GlobeOrMap.prototype._createEntityFromImageryLayerFeature = function(feature) {
    var entity = new Entity({
        id : feature.name,
    });
    entity.name = feature.name;
    entity.description = feature.description;  // already defined by the new Entity

    if (entity.propertyNames.indexOf('properties') === -1) {  // not defined yet, but could be in future
        entity.addProperty('properties');
    }
    entity.properties = feature.properties;

    if (entity.propertyNames.indexOf('data') === -1) {  // not defined yet, but could be in future
        entity.addProperty('data');
    }
    entity.data = feature.data;

    entity.imageryLayer = feature.imageryLayer;
    entity.position = Ellipsoid.WGS84.cartographicToCartesian(feature.position);

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

GlobeOrMap.prototype._highlightFeature = function(feature) {
    if (defined(this._removeHighlightCallback)) {
        this._removeHighlightCallback();
        this._removeHighlightCallback = undefined;
        this._highlightPromise = undefined;
    }

    if (defined(feature)) {
        var hasGeometry = false;

        if (defined(feature.polygon)) {
            hasGeometry = true;

            var polygonOutline = feature.polygon.outline;
            var polygonOutlineColor = feature.polygon.outlineColor;
            var polygonMaterial = feature.polygon.material;

            feature.polygon.outline = true;
            feature.polygon.outlineColor = Color.fromCssColorString(this.terria.baseMapContrastColor);
            feature.polygon.material = Color.fromCssColorString(this.terria.baseMapContrastColor).withAlpha(0.75);

            this._removeHighlightCallback = function() {
                feature.polygon.outline = polygonOutline;
                feature.polygon.outlineColor = polygonOutlineColor;
                feature.polygon.material = polygonMaterial;
            };
        }

        if (defined(feature.polyline)) {
            hasGeometry = true;

            var polylineMaterial = feature.polyline.material;
            var polylineWidth = feature.polyline.width;

            feature.polyline.material = Color.fromCssColorString(this.terria.baseMapContrastColor);
            feature.polyline.width = 2;

            this._removeHighlightCallback = function() {
                feature.polyline.material = polylineMaterial;
                feature.polyline.width = polylineWidth;
            };
        }

        if (!hasGeometry) {
            var geoJson = featureDataToGeoJson(feature.data);

            // Show geometry associated with the feature.
            // Don't show points; the targeting cursor is sufficient.
            if (geoJson && geoJson.geometry && geoJson.geometry.type !== 'Point') {
                var catalogItem = new GeoJsonCatalogItem(this.terria);
                catalogItem.data = geoJson;
                catalogItem.style = {
                  'stroke-width': 2,
                  'stroke': this.terria.baseMapContrastColor,
                  'fill-opacity': 0,
                  'marker-color': this.terria.baseMapContrastColor
                };

                var removeCallback = this._removeHighlightCallback = function() {
                    catalogItem._hide();
                    catalogItem._disable();
                };

                var that = this;
                that._highlightPromise = catalogItem.load().then(function() {
                    if (removeCallback !== that._removeHighlightCallback) {
                        return;
                    }

                    catalogItem._enable();
                    catalogItem._show();
                });
            }
        }
    }
};

module.exports = GlobeOrMap;
