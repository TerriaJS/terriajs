'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var CatalogItemViewModel = require('./CatalogItemViewModel');
var inherit = require('../inherit');

/**
 * A {@link CatalogItemViewModel} that is added to the map as a rasterized imagery layer.
 *
 * @alias ImageryLayerItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * @abstract
 * 
 * @param {ApplicationViewModel} context The context for the group.
 */
var ImageryLayerItemViewModel = function(context) {
    CatalogItemViewModel.call(this, context);

    this._imageryLayer = undefined;

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

ImageryLayerItemViewModel.prototype = inherit(CatalogItemViewModel.prototype);

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
    }
});

ImageryLayerItemViewModel.defaultUpdaters = clone(CatalogItemViewModel.defaultUpdaters);
freezeObject(ImageryLayerItemViewModel.defaultUpdaters);

ImageryLayerItemViewModel.defaultSerializers = clone(CatalogItemViewModel.defaultSerializers);
freezeObject(ImageryLayerItemViewModel.defaultSerializers);

ImageryLayerItemViewModel.prototype._showInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.alpha = this.opacity;
};

ImageryLayerItemViewModel.prototype._hideInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.alpha = 0.0;
};

ImageryLayerItemViewModel.prototype._showInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.setOpacity(this.opacity);
};

ImageryLayerItemViewModel.prototype._hideInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer.setOpacity(0.0);
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
