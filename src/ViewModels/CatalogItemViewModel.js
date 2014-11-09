'use strict';

/*global require,ga,$*/

var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var Scene = require('../../third_party/cesium/Source/Scene/Scene');

var MetadataViewModel = require('./MetadataViewModel');
var CatalogMemberViewModel = require('./CatalogMemberViewModel');
var inherit = require('../Core/inherit');
var NowViewingViewModel = require('./NowViewingViewModel');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var runLater = require('../Core/runLater');
var runWhenDoneLoading = require('./runWhenDoneLoading');

/**
 * A data item in a {@link CatalogGroupViewModel}.
 *
 * @alias CatalogItemViewModel
 * @constructor
 * @extends CatalogMemberViewModel
 * @abstract
 *
 * @param {ApplicationViewModel} application The application.
 */
var CatalogItemViewModel = function(application) {
    CatalogMemberViewModel.call(this, application);

    this._enabledDate = undefined;
    this._shownDate = undefined;
    this._callToEnableIsPending = false;
    this._callToShowIsPending = false;

    /**
     * The index of the item in the Now Viewing list.  Setting this property does not automatically change the order.
     * This property is used intenally to save/restore the Now Viewing order and is not intended for general use.
     * @private
     * @type {Number}
     */
    this.nowViewingIndex = undefined;

    /**
     * Gets or sets the geographic rectangle (extent or bounding box) containing this data item.  This property is observable.
     * @type {Rectangle}
     */
    this.rectangle = Rectangle.MAX_VALUE;

    /**
     * Gets or sets the URL of the legend for this data item, or undefined if this data item does not have a legend.
     * This property is observable.
     * @type {String}
     */
    this.legendUrl = undefined;

    /**
     * Gets or sets the type of the {@link CatalogItemViewModel#dataUrl}, or undefined if raw data for this data
     * source is not available.  This property is observable.
     * Valid values are:
     *  * `direct` - A direct link to the data.
     *  * `wfs` - A Web Feature Service (WFS) base URL.  If {@link CatalogItemViewModel#dataUrl} is not
     *            specified, the base URL will be this data item's URL.
     *  * `wfs-complete` - A complete, ready-to-use link to download features from a WFS server.
     * @type {String}
     */
    this.dataUrlType = undefined;

    /**
     * Gets or sets the URL from which this data item's raw data can be retrieved, or undefined if raw data for
     * this data item is not available.  This property is observable.
     * @type {String}
     */
    this.dataUrl = undefined;

    /**
     * Gets or sets a description of the custodian of this data item.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = undefined;

    /**
     * Gets or sets the URL from which this data item's metadata description can be retrieved, or undefined if
     * metadata is not available for this data item.  The format of the metadata depends on the type of data item.
     * For example, Web Map Service (WMS) data items provide their metadata via their GetCapabilities document.
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
     * Gets or sets a value indicating whether the legend for this data item is currently visible.
     * This property is observable.
     * @type {Boolean}
     */
    this.isLegendVisible = false;

    /**
     * Gets or sets the clock parameters for this data item.  If this property is undefined, this data item
     * does not have any time-varying data.  This property is observable.
     * @type {DataSourceClock}
     */
    this.clock = undefined;

    /**
     * Gets or sets a value indicating whether this data source is currently loading.  This property is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['rectangle', 'legendUrl', 'dataUrlType', 'dataUrl', 'dataCustodian',
                          'metadataUrl', 'isEnabled', 'isShown', 'isLegendVisible', 'clock',
                          'isLoading']);

    knockout.getObservable(this, 'isEnabled').subscribe(function(newValue) {
        isEnabledChanged(this);
    }, this);

    knockout.getObservable(this, 'isShown').subscribe(function(newValue) {
        isShownChanged(this);
    }, this);
};

inherit(CatalogMemberViewModel, CatalogItemViewModel);

var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;

defineProperties(CatalogItemViewModel.prototype, {
    /**
     * Gets a value indicating whether this data item, when enabled, can be reordered with respect to other data items.
     * Data items that cannot be reordered are typically displayed above reorderable data items.
     * @memberOf CatalogItemViewModel.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data item can be changed.
     * @memberOf CatalogItemViewModel.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets a value indicating whether this data item has a legend.
     * @memberOf CatalogItemViewModel.prototype
     * @type {Boolean}
     */
    hasLegend : {
        get : function() {
            return defined(this.legendUrl) && this.legendUrl.length > 0;
        }
    },

    /**
     * Gets a value indicating whether this data item's legend is an image in a
     * browser-supported format such as JPEG, PNG, or GIF.
     * @memberOf CatalogItemViewModel.prototype
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
     * Gets the metadata associated with this data item and the server that provided it, if applicable.
     * @memberOf CatalogItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            return CatalogItemViewModel.defaultMetadata;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CatalogItemViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CatalogItemViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogItemViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogItemViewModel.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMemberViewModel#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CatalogItemViewModel.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CatalogItemViewModel.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default metadata to use for data items that don't provide anything better from their
 * {@link CatalogItemViewModel#metadata} property.  The default simply indicates that no metadata is available.
 * @type {MetadataViewModel}
 */
CatalogItemViewModel.defaultMetadata = new MetadataViewModel();
CatalogItemViewModel.defaultMetadata.isLoading = false;
CatalogItemViewModel.defaultMetadata.dataSourceErrorMessage = 'This data item does not have any details available.';
CatalogItemViewModel.defaultMetadata.serviceErrorMessage = 'This service does not have any details available.';

freezeObject(CatalogItemViewModel.defaultMetadata);

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMemberViewModel#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#updaters} property.
 * @type {Object}
 */
CatalogItemViewModel.defaultUpdaters = clone(CatalogMemberViewModel.defaultUpdaters);
CatalogItemViewModel.defaultUpdaters.rectangle = function(viewModel, json, propertyName) {
    if (defined(json.rectangle)) {
        viewModel.rectangle = Rectangle.fromDegrees(json.rectangle[0], json.rectangle[1], json.rectangle[2], json.rectangle[3]);
    } else {
        viewModel.rectangle = Rectangle.MAX_VALUE;
    }
};

freezeObject(CatalogItemViewModel.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#serializers} property.
 * @type {Object}
 */
CatalogItemViewModel.defaultSerializers = clone(CatalogMemberViewModel.defaultSerializers);
CatalogItemViewModel.defaultSerializers.rectangle = function(viewModel, json, propertyName) {
    if (defined(viewModel.rectangle)) {
        json.rectangle = [
            CesiumMath.toDegrees(viewModel.rectangle.west),
            CesiumMath.toDegrees(viewModel.rectangle.south),
            CesiumMath.toDegrees(viewModel.rectangle.east),
            CesiumMath.toDegrees(viewModel.rectangle.north)
        ];
    }
};

freezeObject(CatalogItemViewModel.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItemViewModel}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogItemViewModel.defaultPropertiesForSharing = clone(CatalogMemberViewModel.defaultPropertiesForSharing);
CatalogItemViewModel.defaultPropertiesForSharing.push('isEnabled');
CatalogItemViewModel.defaultPropertiesForSharing.push('isShown');
CatalogItemViewModel.defaultPropertiesForSharing.push('isLegendVisible');
CatalogItemViewModel.defaultPropertiesForSharing.push('nowViewingIndex');

freezeObject(CatalogItemViewModel.defaultPropertiesForSharing);

/**
 * When implemented in a derived class, loads this data item it is not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogItemViewModel#isLoading} flag will be set while the load is in progress.
 * This method may do nothing if the data item does not do an lazy loading of its data.
 */
CatalogItemViewModel.prototype.load = function() {
};

/**
 * Toggles the {@link CatalogItemViewModel#isEnabled} property of this item.  If it is enabled, calling this method
 * will disable it.  If it is disabled, calling this method will enable it.
 *
 * @returns {Boolean} true if the item is now enabled, false if it is now disabled.
 */
 CatalogItemViewModel.prototype.toggleEnabled = function() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
};

/**
 * Toggles the {@link CatalogItemViewModel#isShown} property of this item.  If it is shown, calling this method
 * will hide it.  If it is hidden, calling this method will show it.
 *
 * @returns {Boolean} true if the item is now shown, false if it is now hidden.
 */
 CatalogItemViewModel.prototype.toggleShown = function() {
    this.isShown = !this.isShown;
    return this.isShown;
};

/**
 * Toggles the {@link CatalogItemViewModel#isLegendVisible} property of this item.  If it is visible, calling this
 * method will hide it.  If it is hidden, calling this method will make it visible.
 * @return {Boolean} true if the legend is now visible, false if it is now hidden.
 */
CatalogItemViewModel.prototype.toggleLegendVisible = function() {
    this.isLegendVisible = !this.isLegendVisible;
    return this.isLegendVisible;
};

var scratchRectangle = new Rectangle();

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItemViewModel#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method does nothing.
 */
 CatalogItemViewModel.prototype.zoomTo = function() {
    runWhenDoneLoading(this, function(that) {
        if (!defined(that.rectangle)) {
            return;
        }

        if (that.rectangle.east - that.rectangle.west > 3.14) {
            console.log('Extent is wider than half the world.  Ignoring zoomto');
            return;
        }

        ga('send', 'event', 'dataSource', 'zoomTo', that.name);

        var epsilon = CesiumMath.EPSILON3;

        var rect = Rectangle.clone(that.rectangle, scratchRectangle);

        if (rect.east - rect.west < epsilon) {
            rect.east += epsilon;
            rect.west -= epsilon;
        }

        if (rect.north - rect.south < epsilon) {
            rect.north += epsilon;
            rect.south -= epsilon;
        }

        var application = that.application;

        if (defined(application.cesium)) {
            var flight = CameraFlightPath.createTweenRectangle(application.cesium.scene, {
                destination : rect
            });
            application.cesium.scene.tweens.add(flight);
        }

        if (defined(application.leaflet)) {
            application.leaflet.map.fitBounds(rectangleToLatLngBounds(rect));
        }
    });
};

/**
 * Uses the {@link CatalogItemViewModel#clock} settings from this data item.  If this data item
 * has no clock settings, this method does nothing.
 */
CatalogItemViewModel.prototype.useClock = function() {
    runWhenDoneLoading(this, function(that) {
        if (!defined(that.clock)) {
            return;
        }

        $('.cesium-viewer-animationContainer').css('visibility', 'visible');
        $('.cesium-viewer-timelineContainer').css('visibility', 'visible');

        that.clock.getValue(that.application.clock);

        if (defined(that.application.cesium)) {
            that.application.cesium.viewer.timeline.zoomTo(that.application.clock.startTime, that.application.clock.stopTime);
            that.application.cesium.viewer.forceResize();
        }

        if (defined(that.application.leaflet)) {
            that.application.leaflet.map.timeline.zoomTo(that.application.clock.startTime, that.application.clock.stopTime);
        }
    });
};

/**
 * Moves the camera so that the data item's bounding rectangle is visible, and updates the application clock according to this
 * data item's clock settings.  This method simply calls {@link CatalogItemViewModel#zoomTo} and
 * {@link CatalogItemViewModel#useClock}.
 */
CatalogItemViewModel.prototype.zoomToAndUseClock = function() {
    this.zoomTo();
    this.useClock();
};

/**
 * Enables this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItemViewModel#isEnabled} property to true.
 * * Will not necessarily be called immediately when {@link CatalogItemViewModel#isEnabled} is set to true; it will be deferred until
 *   {@link CatalogItemViewModel#isLoading} is false.
 * * Should NOT also show the data item on the globe/map (see {@link CatalogItemViewModel#_show}), so in some cases it may not do
 *   anything at all.
 * * Calls {@link CatalogItemViewModel#_enableInCesium} or {@link CatalogItemViewModel#_enableInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical enable logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItemViewModel.prototype._enable = function() {
    var application = this.application;

    if (defined(application.cesium)) {
        this._enableInCesium();
    }

    if (defined(application.leaflet)) {
        this._enableInLeaflet();
    }
};

/**
 * Disables this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItemViewModel#isEnabled} property to false.
 * * Will not be called if {@link CatalogItemViewModel#_enable} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user disabled the data item before the load completed).
 * * Will only be called after {@link CatalogItemViewModel#_hide} when a shown data item is disabled.
 * * Calls {@link CatalogItemViewModel#_disableInCesium} or {@link CatalogItemViewModel#_disableInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical disable logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItemViewModel.prototype._disable = function() {
    var application = this.application;

    if (defined(application.cesium)) {
        this._disableInCesium();
    }

    if (defined(application.leaflet)) {
        this._disableInLeaflet();
    }
};

/**
 * Shows this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItemViewModel#isShown} property to true.
 * * Will only be called after {@link CatalogItemViewModel#_enable}; you can count on that method having been called first.
 * * Will not necessarily be called immediately when {@link CatalogItemViewModel#isShown} is set to true; it will be deferred until
 *   {@link CatalogItemViewModel#isLoading} is false.
 * * Calls {@link CatalogItemViewModel#_showInCesium} or {@link CatalogItemViewModel#_showInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical show logic for both viewers
 *    may override this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItemViewModel.prototype._show = function() {
    var application = this.application;

    if (defined(application.cesium)) {
        this._showInCesium();
    }

    if (defined(application.leaflet)) {
        this._showInLeaflet();
    }
};

/**
 * Hides this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItemViewModel#isShown} property to false.
 * * Will not be called if {@link CatalogItemViewModel#_show} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user hid the data item before the load completed).
 * * Calls {@link CatalogItemViewModel#_hideInCesium} or {@link CatalogItemViewModel#_hideInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical hide logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItemViewModel.prototype._hide = function() {
    var application = this.application;

    if (defined(application.cesium)) {
        this._hideInCesium();
    }

    if (defined(application.leaflet)) {
        this._hideInLeaflet();
    }
};

/**
 * When implemented in a derived class, enables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isEnabled} property to true.  See
 * {@link CatalogItemViewModel#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._enableInCesium = function() {
    throw new DeveloperError('_enableInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, disables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isEnabled} property to false.  See
 * {@link CatalogItemViewModel#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._disableInCesium = function() {
    throw new DeveloperError('_disableInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, shows this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isShown} property to true.  See
 * {@link CatalogItemViewModel#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._showInCesium = function() {
    throw new DeveloperError('_showInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, hides this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isShown} property to false.  See
 * {@link CatalogItemViewModel#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._hideInCesium = function() {
    throw new DeveloperError('_hideInCesium must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, enables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isEnabled} property to true.  See
 * {@link CatalogItemViewModel#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._enableInLeaflet = function() {
    throw new DeveloperError('enableInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, disables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isEnabled} property to false.  See
 * {@link CatalogItemViewModel#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._disableInLeaflet = function() {
    throw new DeveloperError('disableInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, shows this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isShown} property to true.  See
 * {@link CatalogItemViewModel#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._showInLeaflet = function() {
    throw new DeveloperError('_showInLeaflet must be implemented in the derived class.');
};

/**
 * When implemented in a derived class, hides this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItemViewModel#isShown} property to false.  See
 * {@link CatalogItemViewModel#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItemViewModel.prototype._hideInLeaflet = function() {
    throw new DeveloperError('_hideInLeaflet must be implemented in the derived class.');
};

function isEnabledChanged(viewModel) {
    var application = viewModel.application;

    if (viewModel.isEnabled) {
        application.nowViewing.add(viewModel);

        // Load this data item's data (if we haven't already) when it is enabled.
        viewModel.load();

        // Tell this data item to enable itself on the map, but only after we're done loading and only if
        // we haven't already queued a request to enable that is still pending.
        if (!viewModel._callToEnableIsPending) {
            viewModel._callToEnableIsPending = true;
            runWhenDoneLoading(viewModel, function() {
                viewModel._callToEnableIsPending = false;
                if (viewModel.isEnabled) {
                    viewModel._enable();
                }
            });
        }

        viewModel.isShown = true;

        ga('send', 'event', 'dataSource', 'added', viewModel.name);
        viewModel._enabledDate = Date.now();
    } else {
        viewModel.isShown = false;

        // Disable this data item on the map, but only if the previous request to enable it has
        // actually gone through.
        if (!viewModel._callToEnableIsPending) {
            viewModel._disable();
        }

        application.nowViewing.remove(viewModel);

        var duration;
        if (viewModel._enabledDate) {
            duration = ((Date.now() - viewModel._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'removed', viewModel.name, duration);
    }
}

function isShownChanged(viewModel) {
    var application = viewModel.application;

    if (viewModel.isShown) {
        // Tell this data item to show itself on the map, but only after we're done loading and only if
        // we haven't already queued a request to show that is still pending.
        if (!viewModel._callToShowIsPending) {
            viewModel._callToShowIsPending = true;
            runWhenDoneLoading(viewModel, function() {
                viewModel._callToShowIsPending = false;
                if (viewModel.isEnabled && viewModel.isShown) {
                    viewModel._show();
                }
            });
        }

        ga('send', 'event', 'dataSource', 'shown', viewModel.name);
        viewModel._shownDate = Date.now();
    } else {
        // Hide this data item on the map, but only if the previous request to show it has
        // actually gone through.
        if (!viewModel._callToShowIsPending) {
            viewModel._hide();
        }

        var duration;
        if (defined(viewModel._shownDate)) {
            duration = ((Date.now() - viewModel._shownDate) / 1000.0) | 0;
        } else if (viewModel._enabledDate) {
            duration = ((Date.now() - viewModel._enabledDate) / 1000.0) | 0;
        }
        ga('send', 'event', 'dataSource', 'hidden', viewModel.name, duration);
    }
}

module.exports = CatalogItemViewModel;
