'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var inherit = require('../inherit');

/**
 * A {@link GeoDataSourceViewModel} that is added to the map as a rasterized imagery layer.
 *
 * @alias ImageryLayerDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} type The type of imagery layer data source represented by the new instance.
 */
var ImageryLayerDataSourceViewModel = function(context, type) {
    GeoDataSourceViewModel.call(this, context, type);

    /**
     * [_imageryLayer description]
     * @type {[type]}
     */
    this._imageryLayer = undefined;

    /**
     * Gets or sets the alpha (opacity) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.
     * @type {Number}
     */
    this.alpha = 0.6;

    knockout.track(this, ['alpha']);

    knockout.getObservable(this, 'alpha').subscribe(function(newValue) {
        updateAlpha(this);
    }, this);
};

ImageryLayerDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

defineProperties(ImageryLayerDataSourceViewModel.prototype, {
    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
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
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return true;
        }
    }
});

ImageryLayerDataSourceViewModel.prototype.showInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    this._imageryLayer.alpha = this.alpha;
};

ImageryLayerDataSourceViewModel.prototype.hideInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    this._imageryLayer.alpha = 0.0;
};

ImageryLayerDataSourceViewModel.prototype.showInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    this._imageryLayer.setOpacity(this.alpha);
};

ImageryLayerDataSourceViewModel.prototype.hideInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('Data item is not enabled.');
    }

    this._imageryLayer.setOpacity(0.0);
};

function updateAlpha(viewModel) {
    if (defined(viewModel._imageryLayer) && viewModel.isEnabled && viewModel.isShown) {
        if (defined(viewModel._imageryLayer.alpha)) {
            viewModel._imageryLayer.alpha = viewModel.alpha;
        }

        if (defined(viewModel._imageryLayer.setOpacity)) {
            viewModel._imageryLayer.setOpacity(viewModel.alpha);
        }
    }
}

module.exports = ImageryLayerDataSourceViewModel;
