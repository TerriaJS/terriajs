'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var CatalogItemViewModel = require('./CatalogItemViewModel');
var inherit = require('../Core/inherit');
var ViewModelError = require('./ViewModelError');

/**
 * A {@link CatalogItemViewModel} that is added to the map as a rasterized imagery layer.
 *
 * @alias ImageryLayerItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * @abstract
 * 
 * @param {ApplicationViewModel} application The application.
 */
var ImageryLayerItemViewModel = function(application) {
    CatalogItemViewModel.call(this, application);

    this._imageryLayer = undefined;
    this._errorEventUnsubscribe = undefined;

    /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     */
    this.opacity = 0.6;

    knockout.track(this, ['opacity']);

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);
};

inherit(CatalogItemViewModel, ImageryLayerItemViewModel);

defineProperties(ImageryLayerItemViewModel.prototype, {
    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf ImageryLayerItemViewModel.prototype
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
     * @memberOf ImageryLayerItemViewModel.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerItemViewModel.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf ImageryLayerItemViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return ImageryLayerItemViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf ImageryLayerItemViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return ImageryLayerItemViewModel.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMemberViewModel#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf ImageryLayerItemViewModel.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return ImageryLayerItemViewModel.defaultPropertiesForSharing;
        }
    }
});

ImageryLayerItemViewModel.defaultUpdaters = clone(CatalogItemViewModel.defaultUpdaters);
freezeObject(ImageryLayerItemViewModel.defaultUpdaters);

ImageryLayerItemViewModel.defaultSerializers = clone(CatalogItemViewModel.defaultSerializers);
freezeObject(ImageryLayerItemViewModel.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItemViewModel}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
ImageryLayerItemViewModel.defaultPropertiesForSharing = clone(CatalogItemViewModel.defaultPropertiesForSharing);
ImageryLayerItemViewModel.defaultPropertiesForSharing.push('opacity');

freezeObject(ImageryLayerItemViewModel.defaultPropertiesForSharing);

ImageryLayerItemViewModel.prototype._showInCesium = function() {
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

            // Retry once.
            if (tileProviderError.timesRetried === 0) {
                tileProviderError.retry = true;
                return;
            }

            // After two failures, advise the user that something is wrong and disable the catalog item.
            that.application.error.raiseEvent(new ViewModelError({
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

ImageryLayerItemViewModel.prototype._hideInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.show = false;

    if (defined(this._errorEventUnsubscribe)) {
        this._errorEventUnsubscribe();
    }
};

ImageryLayerItemViewModel.prototype._showInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.application.leaflet.map;
    map.addLayer(this._imageryLayer);
    this.application.nowViewing.updateLeafletLayerOrder();
};

ImageryLayerItemViewModel.prototype._hideInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.application.leaflet.map;
    map.removeLayer(this._imageryLayer);
};

function updateOpacity(viewModel) {
    if (defined(viewModel._imageryLayer) && viewModel.isEnabled && viewModel.isShown) {
        if (defined(viewModel._imageryLayer.alpha)) {
            viewModel._imageryLayer.alpha = viewModel.opacity;
        }

        if (defined(viewModel._imageryLayer.setOpacity)) {
            viewModel._imageryLayer.setOpacity(viewModel.opacity);
        }
    }
}

module.exports = ImageryLayerItemViewModel;
