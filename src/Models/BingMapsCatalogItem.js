'use strict';

/*global require,L*/

var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var BingMapsImageryProvider = require('../../third_party/cesium/Source/Scene/BingMapsImageryProvider');
var BingMapsStyle = require('../../third_party/cesium/Source/Scene/BingMapsStyle');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Bing Maps server.
 *
 * @alias BingMapsCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 * 
 * @param {Application} application The application.
 */
var BingMapsCatalogItem = function(application) {
    ImageryLayerCatalogItem.call(this, application);

    /**
     * Gets or sets the style of the Bing Maps map to use.
     * @type {BingMapsStyle}
     */
    this.mapStyle = BingMapsStyle.AERIAL;

    /**
     * Gets or sets the Bing Maps API key to use.  If this property is undefined,
     * {@link BingMapsApi.getKey} is used.
     * @type {String}
     */
    this.key = undefined;

    knockout.track(this, ['mapStyle', 'key']);
};

inherit(ImageryLayerCatalogItem, BingMapsCatalogItem);

defineProperties(BingMapsCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf BingMapsCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'bing-maps';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Bing Maps'.
     * @memberOf BingMapsCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Bing Maps';
        }
    }
});

BingMapsCatalogItem.prototype._enableInCesium = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var scene = this.application.cesium.scene;

    var imageryProvider = new BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        mapStyle: this.mapStyle,
        key: this.key
    });

    this._imageryLayer = new ImageryLayer(imageryProvider, {
        show: false,
        alpha : this.opacity
    });

    scene.imageryLayers.add(this._imageryLayer);
};

BingMapsCatalogItem.prototype._disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;

    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
};

BingMapsCatalogItem.prototype._enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var options = {
        type: this.mapStyle,
        opacity : this.opacity
    };

    var key = this.key;
    if (!defined(key)) {
        key = BingMapsApi.getKey();
    }

    this._imageryLayer = new L.BingLayer(key, options);
};

BingMapsCatalogItem.prototype._disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer = undefined;
};

module.exports = BingMapsCatalogItem;
