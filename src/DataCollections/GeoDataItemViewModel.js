'use strict';

/*global require,ga*/

var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var Scene = require('../../third_party/cesium/Source/Scene/Scene');

var NowViewingViewModel = require('./NowViewingViewModel');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

/**
 * An item in a {@link GeoDataGroupViewModel}.
 * @alias GeoDataItemViewModel
 * @constructor
 *
 * @param {String} type The type of data item represented by the new instance.
 */
var GeoDataItemViewModel = function(type) {
    if (!defined(type)) {
        throw new DeveloperError('type is required.');
    }

    this._type = type;
    this._isEnabled = false; // observable
    this._isShown = false; // observable
    this._enabledDate = undefined;
    this._shownDate = undefined;

    /**
     * Gets or sets the name of the item.  This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Item';

    /**
     * Gets or sets the description of the item.  This property is observable.
     * @type {String}
     */
    this.description = '';

    /**
     * Gets or sets the geographic rectangle containing this data item.  This property
     * is observable.
     * @type {Rectangle}
     */
    this.rectangle = Rectangle.fromDegrees(-180, -90, 180, 90);

    /**
     * Gets or sets a value indicating whether this data item is enabled.  An enabled data item
     * appears up in the "Now Viewing" pane, but is not necessarily shown on the map.
     * @type {Boolean}
     */

    knockout.track(this, ['name', 'description', 'rectangle', '_isEnabled', '_isShown']);
};

defineProperties(GeoDataItemViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @type {String}
     */
    type : {
        get : function() {
            return this._type;
        }
    },

    /**
     * Gets a value indicating whether this data item is enabled.  An enabled data item appears in the
     * "Now Viewing" pane, but is not necessarily shown on the map.  This property is observable.
     * @type {Boolean}
     */
    isEnabled : {
        get : function() {
            return this._isEnabled;
        }
    },

    /**
     * Gets a value indicating whether this data item can be enabled/disabled by calling {@link GeoDataItemViewModel#toggleEnabled}.
     * @type {Boolean}
     */
    canToggleEnabled : {
        get : function() {
            return defined(this.enableInCesium) && defined(this.enableInLeaflet) &&
                   defined(this.disableInCesium) && defined(this.disableInLeaflet);
        }
    },

    /**
     * Gets a value indicating whether this data item is currently shown on the map.  In order to be shown,
     * the item must also be enabled.
     * @type {Boolean}
     */
    isShown : {
        get : function() {
            return this._isShown;
        }
    }
});

/**
 * Toggles the {@link GeoDataItemViewModel#isEnabled} property of this item.  If it is enabled, calling this method
 * will disable it.  If it is disabled, calling this method will enable it.
 *
 * @param {Scene|L.map} sceneOrMap The Cesium Scene or Leaflet Map in which to toggle the data item.
 * @param {NowViewingViewModel} nowViewing The Now Viewing view model to which the item will be added if it is enabled, or removed if it is disabled.
 * @returns {Boolean} true if the item is now enabled, false if it is now disabled.
 */
GeoDataItemViewModel.prototype.toggleEnabled = function(sceneOrMap, nowViewing) {
    if (!this.canToggleEnabled) {
        throw new DeveloperError('This data item\'s enabled state cannot be toggled.');
    }

    if (sceneOrMap instanceof Scene) {
        if (!this._isEnabled) {
            this.enableInCesium(sceneOrMap);
        } else {
            this.disableInCesium(sceneOrMap);
        }
    } else {
        if (!this._isEnabled) {
            this.enableInLeaflet(sceneOrMap);
        } else {
            this.disableInLeaflet(sceneOrMap);
        }
    }

    this._isEnabled = !this._isEnabled;
    this._isShown = this._isEnabled;

    if (this._isEnabled) {
        nowViewing.add(this);

        ga('send', 'event', 'dataSource', 'added', this.name);
        this._enabledDate = Date.now();
    } else {
        nowViewing.remove(this);

        var duration;
        if (this._enabledDate) {
            duration = ((Date.now() - this._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'removed', this.name, duration);
    }

    return this._isEnabled;
};

/**
 * Toggles the {@link GeoDataItemViewModel#isShown} property of this item.  If it is shown, calling this method
 * will hide it.  If it is hidden, calling this method will show it.
 *
 * @param {Scene|L.map} sceneOrMap The Cesium Scene or Leaflet Map in which to toggle the data item.
 * @returns {Boolean} true if the item is now shown, false if it is now hidden.
 */
GeoDataItemViewModel.prototype.toggleShown = function(sceneOrMap) {
    if (sceneOrMap instanceof Scene) {
        if (!this._isShown) {
            this.showInCesium(sceneOrMap);
        } else {
            this.hideInCesium(sceneOrMap);
        }
    } else {
        if (!this._isShown) {
            this.showInLeaflet(sceneOrMap);
        } else {
            this.hideInLeaflet(sceneOrMap);
        }
    }

    this._isShown = !this._isShown;

    if (this._isShown) {
        ga('send', 'event', 'dataSource', 'shown', this.name);
        this._shownDate = Date.now();
    } else {
        var duration;
        if (defined(this._shownDate)) {
            duration = ((Date.now() - this._shownDate) / 1000.0) | 0;
        } else if (this._enabledDate) {
            duration = ((Date.now() - this._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'hidden', this.name, duration);
    }

    return this._isShown;
};

var scratchRectangle = new Rectangle();

/**
 * Moves the camera so that the item's bounding rectangle is visible.
 * @param {Scene|L.map} sceneOrMap The Cesium Scene or Leaflet map to zoom.
 * @param {Number} flightTimeSeconds The number of seconds over which to fly the camera.  This parameter is ignored in Leaflet.
 */
GeoDataItemViewModel.prototype.zoomTo = function(sceneOrMap, flightTimeSeconds) {
    if (!this.isEnabled || !this.isShown || !defined(this.rectangle)) {
        return;
    }

    ga('send', 'event', 'dataSource', 'zoomTo', this.name);

    var epsilon = CesiumMath.EPSILON3;

    var rect = Rectangle.clone(this.rectangle, scratchRectangle);

    if (rect.east - rect.west < epsilon) {
        rect.east += epsilon;
        rect.west -= epsilon;
    }

    if (rect.north - rect.south < epsilon) {
        rect.north += epsilon;
        rect.south -= epsilon;
    }


    if (sceneOrMap instanceof Scene) {
        var flight = CameraFlightPath.createTweenRectangle(sceneOrMap, {
            destination : rect,
            duration: flightTimeSeconds
        });
        sceneOrMap.tweens.add(flight);
    } else {
        sceneOrMap.fitBounds(rectangleToLatLngBounds(rect));
    }
};

module.exports = GeoDataItemViewModel;
