'use strict';

/*global require,L*/

var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var sampleTerrain = require('terriajs-cesium/Source/Core/sampleTerrain');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var lowestTerrainLevel = require('../Map/lowestTerrainLevel');

/**
 * The model for an image icon that can be displayed in both cesium and leaflet.
 *
 * @alias MapIcon
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} [options.terria] The terria instance.
 * @param {String} [options.image] The url to the image resource.
 * @param {Integer} [options.imageHeight] The height of the image.
 * @param {Integer} [options.imageWidth] The width of the iamge.
 * @param {Integer} [options.imageAnchorHeight=0] The height of the icon which will correspond to its location.
 * @param {Integer} [options.imageAnchorWidth=0] The width of the icon which will correspond to its location.
 */
var MapIcon = function(options) {
    if (!defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }
    if (!defined(options.image)) {
        throw new DeveloperError('options.image is required.');
    }
    if (!defined(options.imageHeight)) {
        throw new DeveloperError('options.imageHeight is required.');
    }
    if (!defined(options.imageWidth)) {
        throw new DeveloperError('options.imageWidth is required.');
    }

    this._terria = options.terria;

    this.image = options.image;

    this.imageHeight = options.imageHeight;

    this.imageWidth = options.imageWidth;

    this.imageAnchorHeight = defaultValue(options.imageAnchorHeight, 0);

    this.imageAnchorWidth = defaultValue(options.imageAnchorWidth, 0);

    this._icon = undefined;

    this._position = undefined;

};

defineProperties(MapIcon.prototype, {

    /**
     * Gets the terria instancee.
     * @memberOf MapIcon.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
            return this._terria;
        }
    },

    /**
     * Gets icon to be displayed on the map.
     * @memberOf MapIcon.prototype
     * @type {Entity|L.marker}
     */
    icon : {
        get : function() {
            return this._icon;
        }
    },

    /**
     * Gets the position of the icon.
     * @memberOf MapIcon.prototype
     * @type {Cartographic}
     */
    position : {
        get : function() {
            return this._position;
        }
    },

});

/**
 * Shows this icon on the globe or map.  This method:
 * calls {@link MapIcon#_showInCesium} or {@link MapIcon#_showInLeaflet},
 * depending on which viewer is active.
 * @protected
 */
MapIcon.prototype.show = function(position) {

    if (!defined(position)) {
        throw new DeveloperError('position is required.');
    }

    if (!position instanceof Cartographic) {
        throw new DeveloperError('position must ne an instance of Cartographic.');
    }

    if (defined(this.terria.cesium)) {
        this._showInCesium();
    }

    if (defined(this.terria.leaflet)) {
        this._showInLeaflet();
    }
};

/**
 * Hides this icon.  This method:
 * calls {@link MapIcon#_hideInCesium} or {@link MapIcon#_hideInLeaflet},
 * depending on which viewer is active.
 * @protected
 */
MapIcon.prototype.hide = function() {

    if (defined(this.terria.cesium)) {
        this._hideInCesium();
    }

    if (defined(this.terria.leaflet)) {
        this._hideInLeaflet();
    }

    this.position = undefined;
};

/**
 * Shows this icon on the globe.
 * @protected
 */
MapIcon.prototype._showInCesium = function() {

    var billboard = {
        image: this.image,
        width: this.imageWidth,
        height: this.imageHeight,
        pixeloffset: new Cartesian2(this.imageAnchorWidth, this.imageAnchorHeight),
    };

    var cartesian = Ellipsoid.WGS84.cartographicToCartesian(this.position);

    var entity = {
        billboard: billboard,
        position: cartesian,
    };

    this._icon = this.terria.cesium.viewer.entities.add(entity);
    this._updateHeightFromTerrain();
};

/**
 * Removes this icon from the globe.
 * @protected
 */
MapIcon.prototype._hideInCesium = function() {
    this.terria.cesium.viewer.entities.remove(this._icon);
    this._icon = undefined;
};

/**
 * Shows this icon on the map.
 * @protected
 */
MapIcon.prototype._showInLeaflet = function() {

    var leafletIcon = L.icon({
        iconUrl: this.image,
        iconSize: [this.imageWidth, this.imageHeight],
        iconAnchor: [this.imageAnchorWidth, this.imageAnchorHeight],
    });

    var latLng = [this.position.latitude, this.position.longitude];

    this._icon = L.marker(latLng, {
        icon    : leafletIcon,
        title   : this.name,
        id      : this.id
    });

    this.terria.leaflet.map.addLayer(this._icon);
};

/**
 * Removes this icon from the map.
 * @protected
 */
MapIcon.prototype._hideInLeaflet = function() {
    this.terria.leaflet.map.removeLayer(this._icon);
    this._icon = undefined;
};

/**
 * Finds the height from the terrain at the position of the icon and updates the
 * icon's position accodingly.
 * @protected
 */
MapIcon.prototype._updateHeightFromTerrain = function() {
    var that = this;

    var terrainProvider = this.terria.cesium.scene.terrainProvider;
    var levelPromise = lowestTerrainLevel(this.position);
    return when(levelPromise, function(level){
        var terrainPromise = sampleTerrain(terrainProvider,level,[this.position]);

        return when(terrainPromise, function(newPos) {
            var cartPos = Cartesian3.fromRadians(newPos[0].longitude,newPos[0].latitude,newPos[0].height);
            that._icon.position.setValue(cartPos);
        });
    });
};

module.exports = MapIcon;
