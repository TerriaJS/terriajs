'use strict';

/*global require,ga*/

var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var Scene = require('../../third_party/cesium/Source/Scene/Scene');

var GeoDataItemViewModel = require('./GeoDataItemViewModel');
var inherit = require('../inherit');
var NowViewingViewModel = require('./NowViewingViewModel');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

/**
 * A data source in a {@link GeoDataGroupViewModel}.
 *
 * @alias GeoDataSourceViewModel
 * @constructor
 * @extends GeoDataItemViewModel
 * @abstract
 *
 * @param {GeoDataCatalogContext} context The context for the item.
 */
var GeoDataSourceViewModel = function(context) {
    GeoDataItemViewModel.call(this, context);

    this._enabledDate = undefined;
    this._shownDate = undefined;

    /**
     * Gets or sets the geographic rectangle containing this data source.  This property is observable.
     * @type {Rectangle}
     */
    this.rectangle = Rectangle.MAX_VALUE;

    /**
     * Gets or sets the URL of the legend for this data source, or undefined if this data source does not have a legend.
     * This property is observable.
     * @type {String}
     */
    this.legendUrl = undefined;

    /**
     * Gets or sets the type of the {@link GeoDataSourceViewModel#dataUrl}, or undefined if raw data for this data
     * source is not available.  This property is observable.
     * Valid values are:
     *  * `direct` - A direct link to the data.
     *  * `wfs` - A Web Feature Service (WFS) base URL.  If {@link GeoDataSourceViewModel#dataUrl} is not
     *            specified, the base URL will be this data source's URL.
     *  * `wfs-complete` - A complete, ready-to-use link to download features from a WFS server.
     * @type {String}
     */
    this.dataUrlType = undefined;

    /**
     * Gets or sets the URL from which this data item's raw data can be retrieved, or undefined if raw data for
     * this data source is not available.  This property is observable.
     * @type {String}
     */
    this.dataUrl = undefined;

    /**
     * Gets or sets a description of the custodian of this data source.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = 'Unknown';

    /**
     * Gets or sets the URL from which this data source's metadata description can be retrieved, or undefined if
     * metadata is not available for this data source.  The format of the metadata depends on the type of data source.
     * For example, Web Map Service (WMS) data sources provide their metadata via their GetCapabilities document.
     * This property is observable.
     * @type {String}
     */
    this.metadataUrl = undefined;

    /**
     * Gets or sets a value indicating whether this data item is enabled.  An enabled data item appears in the
     * "Now Viewing" pane, but is not necessarily shown on the map.  This property is observable.
     * @type {Boolean}
     */
    this.isEnabled = false;

    /**
     * Gets or sets a value indicating whether this data item is currently shown on the map.  In order to be shown,
     * the item must also be enabled.  This property is observable.
     * @type {Boolean}
     */
    this.isShown = false;

    /**
     * Gets or sets a value indicating whether the legend for this data source is currently visible.
     * This property is observable.
     * @type {Boolean}
     */
    this.isLegendVisible = false;

    knockout.track(this, ['isEnabled', 'isShown', 'isLegendVisible']);

    knockout.getObservable(this, 'isEnabled').subscribe(function(newValue) {
        isEnabledChanged(this);
    }, this);

    knockout.getObservable(this, 'isShown').subscribe(function(newValue) {
        isShownChanged(this);
    }, this);
};

GeoDataSourceViewModel.prototype = inherit(GeoDataItemViewModel.prototype);

var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;

defineProperties(GeoDataSourceViewModel.prototype, {
    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether this data source has a legend.
     * @type {Boolean}
     */
    hasLegend : {
        get : function() {
            return defined(this.legendUrl) && this.legendUrl.length > 0;
        }
    },

    /**
     * Gets a value indicating whether this data source's legend is an image in a
     * browser-supported format such as JPEG, PNG, or GIF.
     * @type {Boolean}
     */
    legendIsImage : {
        get : function() {
            if (!defined(this.legendUrl) || this.legendUrl.length === 0) {
                return false;
            }

            return this.legendUrl.match(imageUrlRegex);
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link GeoDataItemViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @type {Object}
     */
    updaters : {
        get : function() {
            return GeoDataSourceViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link GeoDataItemViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @type {Object}
     */
    serializers : {
        get : function() {
            return GeoDataSourceViewModel.defaultSerializers;
        }
    }
});

GeoDataSourceViewModel.defaultUpdaters = clone(GeoDataItemViewModel.defaultUpdaters);
GeoDataSourceViewModel.defaultUpdaters.rectangle = function(viewModel, json, propertyName) {
    if (defined(json.rectangle)) {
        viewModel.rectangle = Rectangle.fromDegrees(json.rectangle[0], json.rectangle[1], json.rectangle[2], json.rectangle[3]);
    } else {
        viewModel.rectangle = Rectangle.MAX_VALUE;
    }
};

GeoDataSourceViewModel.defaultSerializers = clone(GeoDataItemViewModel.defaultSerializers);
GeoDataSourceViewModel.defaultSerializers.rectangle = function(viewModel, json, propertyName) {
    if (defined(viewModel.rectangle)) {
        json.rectangle = [
            CesiumMath.toDegrees(viewModel.rectangle.west),
            CesiumMath.toDegrees(viewModel.rectangle.south),
            CesiumMath.toDegrees(viewModel.rectangle.east),
            CesiumMath.toDegrees(viewModel.rectangle.north)
        ];
    }
};

/**
 * Toggles the {@link GeoDataSourceViewModel#isEnabled} property of this item.  If it is enabled, calling this method
 * will disable it.  If it is disabled, calling this method will enable it.
 *
 * @returns {Boolean} true if the item is now enabled, false if it is now disabled.
 */
 GeoDataSourceViewModel.prototype.toggleEnabled = function() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
};

/**
 * Toggles the {@link GeoDataSourceViewModel#isShown} property of this item.  If it is shown, calling this method
 * will hide it.  If it is hidden, calling this method will show it.
 *
 * @returns {Boolean} true if the item is now shown, false if it is now hidden.
 */
 GeoDataSourceViewModel.prototype.toggleShown = function() {
    this.isShown = !this.isShown;
    return this.isShown;
};

/**
 * Toggles the {@link GeoDataSourceViewModel#isLegendVisible} property of this item.  If it is visible, calling this
 * method will hide it.  If it is hidden, calling this method will make it visible.
 * @return {Boolean} true if the legend is now visible, false if it is now hidden.
 */
GeoDataSourceViewModel.prototype.toggleLegendVisible = function() {
    this.isLegendVisible = !this.isLegendVisible;
    return this.isLegendVisible;
};

var scratchRectangle = new Rectangle();

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link GeoDataSourceViewModel#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data source is not enabled
 * or not shown, this method does nothing.
 */
 GeoDataSourceViewModel.prototype.zoomTo = function() {
    if (!this.isEnabled || !this.isShown || !defined(this.rectangle)) {
        return;
    }

    if (this.rectangle.east - this.rectangle.west > 3.14) {
        console.log('Extent is wider than half the world.  Ignoring zoomto');
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

    var context = this.context;

    if (defined(context.cesiumScene)) {
        var flight = CameraFlightPath.createTweenRectangle(context.cesiumScene, {
            destination : rect
        });
        context.cesiumScene.tweens.add(flight);
    }

    if (defined(context.leafletMap)) {
        context.leafletMap.fitBounds(rectangleToLatLngBounds(rect));
    }
};

/**
 * When implemented in a derived class, enables this data source on the Cesium globe.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isEnabled} property to true.  This method will throw an exception
 * if the data source is already enabled.  Calling this method should NOT also show the data source
 * on the globe (see {@link GeoDataSourceViewModel#showInCesium}), so in some cases it may not do anything at all.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is already enabled.
 */
GeoDataSourceViewModel.prototype._enableInCesium = function() {
    throw new DeveloperError('_enableInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, disables this data source on the Cesium globe.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isEnabled} property to false.  This method will throw an exception
 * if the data source is not enabled.  When implementing this method in a derived class, you can assume that
 * {@link GeoDataSourceViewModel#hideInCesium} will be called on a shown data source before this method is called.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 */
GeoDataSourceViewModel.prototype._disableInCesium = function() {
    throw new DeveloperError('_disableInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, shows this data source on the Cesium globe.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isShown} property to true.  This method will throw an exception
 * if the data source is already shown or if it is not enabled.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 * @throws {DeveloperError} If the data source is already shown.
 */
GeoDataSourceViewModel.prototype._showInCesium = function() {
    throw new DeveloperError('_showInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, hides this data source on the Cesium globe.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isShown} property to false.  This method will throw an exception
 * if the data source is not shown or if it is not enabled.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 * @throws {DeveloperError} If the data source is not shown.
 */
GeoDataSourceViewModel.prototype._hideInCesium = function() {
    throw new DeveloperError('_hideInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, enables this data source on the Leaflet map.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isEnabled} property to true.  This method will throw an exception
 * if the data source is already enabled.  Calling this method should NOT also show the data source
 * on the map (see {@link GeoDataSourceViewModel#showInLeaflet}), so in some cases it may not do anything at all.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is already enabled.
 */
GeoDataSourceViewModel.prototype._enableInLeaflet = function() {
    throw new DeveloperError('enableInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, disables this data source on the Leaflet map.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isEnabled} property to false.  This method will throw an exception
 * if the data source is not enabled.  When implementing this method in a derived class, you can assume that
 * {@link GeoDataSourceViewModel#hideInLeaflet} will be called on a shown data source before this method is called.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 */
GeoDataSourceViewModel.prototype._disableInLeaflet = function() {
    throw new DeveloperError('disableInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, shows this data source on the Leaflet map.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isShown} property to true.  This method will throw an exception
 * if the data source is already shown or if it is not enabled.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 * @throws {DeveloperError} If the data source is already shown.
 */
GeoDataSourceViewModel.prototype._showInLeaflet = function() {
    throw new DeveloperError('_showInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, hides this data source on the Leaflet map.  You should not call this
 * directly, but instead set the {@link GeoDataSourceViewModel#isShown} property to false.  This method will throw an exception
 * if the data source is not shown or if it is not enabled.
 * @abstract
 * @protected
 * @throws {DeveloperError} If the data source is not enabled.
 * @throws {DeveloperError} If the data source is not shown.
 */
GeoDataSourceViewModel.prototype._hideInLeaflet = function() {
    throw new DeveloperError('_hideInLeaflet must be implemented in the derived class.');
};

function isEnabledChanged(viewModel) {
    var context = viewModel.context;

    if (viewModel.isEnabled) {
        enable(viewModel);
        viewModel.isShown = true;

        context.nowViewing.add(viewModel);

        ga('send', 'event', 'dataSource', 'added', viewModel.name);
        viewModel._enabledDate = Date.now();
    } else {
        viewModel.isShown = false;
        disable(viewModel);

        context.nowViewing.remove(viewModel);

        var duration;
        if (viewModel._enabledDate) {
            duration = ((Date.now() - viewModel._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'removed', viewModel.name, duration);
    }
}

function isShownChanged(viewModel) {
    var context = viewModel.context;

    if (viewModel.isShown) {
        show(viewModel)
    } else {
        hide(viewModel);
    }

    if (viewModel.isShown) {
        ga('send', 'event', 'dataSource', 'shown', viewModel.name);
        viewModel._shownDate = Date.now();
    } else {
        var duration;
        if (defined(viewModel._shownDate)) {
            duration = ((Date.now() - viewModel._shownDate) / 1000.0) | 0;
        } else if (viewModel._enabledDate) {
            duration = ((Date.now() - viewModel._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'hidden', viewModel.name, duration);
    }
}

function enable(viewModel) {
    var context = viewModel.context;
    if (defined(context.cesiumScene)) {
        viewModel._enableInCesium();
    } else {
        viewModel._enableInLeaflet();
    }
}

function disable(viewModel) {
    var context = viewModel.context;
    if (defined(context.cesiumScene)) {
        viewModel._disableInCesium();
    } else {
        viewModel._disableInLeaflet();
    }
}

function show(viewModel) {
    var context = viewModel.context;
    if (defined(context.cesiumScene)) {
        viewModel._showInCesium();
    } else {
        viewModel._showInLeaflet();
    }
}

function hide(viewModel) {
    var context = viewModel.context;
    if (defined(context.cesiumScene)) {
        viewModel._hideInCesium();
    } else {
        viewModel._hideInLeaflet();
    }
}

module.exports = GeoDataSourceViewModel;
