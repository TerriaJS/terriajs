'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');

/**
 * A {@link CatalogItem} that is added to the map as a rasterized imagery layer.
 *
 * @alias ImageryLayerCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 * 
 * @param {Application} application The application.
 */
var ImageryLayerCatalogItem = function(application) {
    CatalogItem.call(this, application);

    this._imageryLayer = undefined;
    this._errorEventUnsubscribe = undefined;

    /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     * @default 0.6
     */
    this.opacity = 0.6;

    /**
     * Gets or sets a value indicating whether a 404 response code when requesting a tile should be
     * treated as an error.  If false, 404s are assumed to just be missing tiles and need not be
     * reported to the user.
     * @type {Boolean}
     * @default false
     */
    this.treat404AsError = false;

    knockout.track(this, ['opacity', 'treat404AsError']);

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);
};

inherit(CatalogItem, ImageryLayerCatalogItem);

defineProperties(ImageryLayerCatalogItem.prototype, {
    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            return this._imageryLayer;
        }
    },

    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return ImageryLayerCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return ImageryLayerCatalogItem.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return ImageryLayerCatalogItem.defaultPropertiesForSharing;
        }
    }
});

ImageryLayerCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);
freezeObject(ImageryLayerCatalogItem.defaultUpdaters);

ImageryLayerCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);
freezeObject(ImageryLayerCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
ImageryLayerCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
ImageryLayerCatalogItem.defaultPropertiesForSharing.push('opacity');

freezeObject(ImageryLayerCatalogItem.defaultPropertiesForSharing);

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
  */
ImageryLayerCatalogItem.prototype.lowerToBottom = function() {
    if (!defined(this._imageryLayer)) {
        return;
    }

    if (defined(this.application.cesium)) {
        this.application.cesium.scene.imageryLayers.lowerToBottom(this._imageryLayer);
    }

    if (defined(this.application.leaflet)) {
        this._imageryLayer.setZIndex(0);
    }
};

ImageryLayerCatalogItem.prototype._showInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var imageryProvider = this._imageryLayer.imageryProvider;
    var errorEvent = imageryProvider.errorEvent;

    if (defined(errorEvent)) {
        var that = this;
        this._errorEventUnsubscribe = errorEvent.addEventListener(function(tileProviderError) {
            // We're only concerned about failures for tiles that actually overlap this item's extent.
            if (defined(that.extent)) {
                var tilingScheme = imageryProvider.tilingScheme;
                var tileExtent = tilingScheme.tileXYToRectangle(tileProviderError.x, tileProviderError.y, tileProviderError.level);
                var intersection = Rectangle.intersectWith(tileExtent, that.extent);
                if (Rectangle.isEmpty(intersection)) {
                    return;
                }
            }

            if (!that.treat404AsError && defined(tileProviderError.error) && tileProviderError.error.statusCode === 404) {
                return;
            }

            // Retry 3 times.
            if (tileProviderError.timesRetried < 3) {
                tileProviderError.retry = true;
                return;
            }

            // After three failures, advise the user that something is wrong and disable the catalog item.
            that.application.error.raiseEvent(new ModelError({
                sender: that,
                title: 'Error accessing catalogue item',
                message: '\
An error occurred while attempting to download tiles for catalogue item ' + that.name + '.  This may indicate that there is a \
problem with your internet connection, that the catalogue item is temporarily unavailable, or that the catalogue item \
is invalid.  The catalogue item has been hidden from the map.  You may re-show it in the Now Viewing panel to try again.'
            }));

            that.isShown = false;
        });
    }

    this._imageryLayer.show = true;
};

ImageryLayerCatalogItem.prototype._hideInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.show = false;

    if (defined(this._errorEventUnsubscribe)) {
        this._errorEventUnsubscribe();
    }
};

ImageryLayerCatalogItem.prototype._showInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.application.leaflet.map;
    map.addLayer(this._imageryLayer);
    this.application.nowViewing.updateLeafletLayerOrder();
};

ImageryLayerCatalogItem.prototype._hideInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.application.leaflet.map;
    map.removeLayer(this._imageryLayer);
};

function updateOpacity(imageryLayerItem) {
    if (defined(imageryLayerItem._imageryLayer) && imageryLayerItem.isEnabled && imageryLayerItem.isShown) {
        if (defined(imageryLayerItem._imageryLayer.alpha)) {
            imageryLayerItem._imageryLayer.alpha = imageryLayerItem.opacity;
        }

        if (defined(imageryLayerItem._imageryLayer.setOpacity)) {
            imageryLayerItem._imageryLayer.setOpacity(imageryLayerItem.opacity);
        }

        imageryLayerItem.application.currentViewer.notifyRepaintRequired();
    }
}

module.exports = ImageryLayerCatalogItem;
