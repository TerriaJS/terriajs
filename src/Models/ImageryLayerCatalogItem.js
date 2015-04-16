'use strict';

/*global require*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var DataSourceClock = require('../../third_party/cesium/Source/DataSources/DataSourceClock');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var TimeInterval = require('../../third_party/cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('../../third_party/cesium/Source/Core/TimeIntervalCollection');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');

var CatalogItem = require('./CatalogItem');
var CesiumTileLayer = require('../Map/CesiumTileLayer');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');
var overrideProperty = require('../Core/overrideProperty');
var pollToPromise = require('../Core/pollToPromise');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

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
    this._clock = undefined;
    this._clockTickUnsubscribe = undefined;
    this._currentIntervalIndex = -1;
    this._nextIntervalIndex = undefined;
    this._nextLayer = undefined;

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

    /**
     * Gets or sets a value indicating whether non-specific (no HTTP status code) tile errors should be ignored. This is a
     * last resort, for dealing with odd cases such as data sources that return non-images (eg XML) with a 200 status code.
     * No error messages will be shown to the user.
     * @type {Boolean}
     * @default false
     */
    this.ignoreUnknownTileErrors = false;

    /**
     * Gets or sets the {@link TimeIntervalCollection} defining the intervals of distinct imagery.  If this catalog item
     * is not time-dynamic, property is undefined.  This property is observable.
     * @type {ImageryLayerInterval[]}
     * @default undefined
     */
    this.intervals = undefined;

    knockout.track(this, ['_clock', 'opacity', 'treat404AsError', 'ignoreUnknownTileErrors', 'intervals']);

    overrideProperty(this, 'clock', {
        get : function() {
            var clock = this._clock;
            if (!clock && this.intervals && this.intervals.length > 0) {
                var startTime = this.intervals.start;
                var stopTime = this.intervals.stop;

                // Average about 5 seconds per interval.
                var totalDuration = JulianDate.secondsDifference(stopTime, startTime);
                var numIntervals = this.intervals.length;
                var averageDuration = totalDuration / numIntervals;
                var timePerSecond = averageDuration / 5;

                this._clock = new DataSourceClock();
                this._clock.startTime = startTime;
                this._clock.stopTime = stopTime;
                this._clock.currentTime = startTime;
                this._clock.multiplier = timePerSecond;
            }
            return this._clock;
        },
        set : function(value) {
            this._clock = value;
        }
    });

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);

    // Subscribe to isShown changing and add/remove the clock tick subscription as necessary.
    knockout.getObservable(this, 'isShown').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    knockout.getObservable(this, 'clock').subscribe(function() {
        updateClockSubscription(this);
    }, this);
};

inherit(CatalogItem, ImageryLayerCatalogItem);

defineProperties(ImageryLayerCatalogItem.prototype, {
    /**
     * Gets a value indicating whether this {@link ImageryLayerCatalogItem} supports the {@link ImageryLayerCatalogItem#intervals}
     * property for configuring time-dynamic imagery.
     * @type {Boolean}
     */
    supportsIntervals : {
        get : function() {
            return false;
        }
    },

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

ImageryLayerCatalogItem.defaultUpdaters.intervals = function(catalogItem, json, propertyName) {
    if (!defined(json.intervals)) {
        return;
    }

    if (!catalogItem.supportsIntervals) {
        throw new ModelError({
            sender: catalogItem,
            title: 'Intervals not supported',
            message: 'Sorry, ' + catalogItem.typeName + ' (' + catalogItem.type + ') catalog items cannot currently be made time-varying by specifying the "intervals" property.'
        });
    }

    var result = new TimeIntervalCollection();

    for (var i = 0; i < json.intervals.length; ++i) {
        var interval = json.intervals[i];
        result.addInterval(TimeInterval.fromIso8601({
            iso8601: interval.interval,
            data: interval.data
        }));
    }

    catalogItem.intervals = result;
};

freezeObject(ImageryLayerCatalogItem.defaultUpdaters);

ImageryLayerCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

ImageryLayerCatalogItem.defaultSerializers.intervals = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.intervals)) {
        var result = [];
        for (var i = 0; i < catalogItem.intervals.length; ++i) {
            var interval = catalogItem.intervals[i];
            result.push({
                interval: TimeInterval.toIso8601(interval),
                data: interval.data
            });
        }
    }
};

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

/**
 * When implemented in a derived class, creates the {@link ImageryProvider} for this catalog item.
 * @abstract
 * @protected
 * @param {ImageryLayerTime} [time] The time for which to create an imagery provider.  In layers that are not time-dynamic,
 *                                  this parameter is ignored.
 * @return {ImageryProvider} The created imagery provider.
 */
ImageryLayerCatalogItem.prototype._createImageryProvider = function(time) {
    throw new DeveloperError('_createImageryProvider must be implemented in the derived class.');
};

ImageryLayerCatalogItem.prototype._enable = function() {
    if (defined(this._imageryLayer)) {
        return;
    }

    var isTimeDynamic = false;
    var currentTimeIdentifier;
    var nextTimeIdentifier;

    if (defined(this.intervals)) {
        isTimeDynamic = true;

        var clock = this.application.clock;
        var index = this.intervals.indexOf(clock.currentTime);

        var nextIndex;
        if (index < 0) {
            this._currentIntervalIndex = -1;
            currentTimeIdentifier = undefined;

            nextIndex = ~index;
            if (clock.multiplier < 0.0) {
                --nextIndex;
            }
        } else {
            this._currentIntervalIndex = index;
            currentTimeIdentifier = this.intervals.get(index).data;
            
            if (clock.multiplier < 0.0) {
                nextIndex = index - 1;
            } else {
                nextIndex = index + 1;
            }
        }

        if (nextIndex >= 0 && nextIndex < this.intervals.length) {
            this._nextIntervalIndex = nextIndex;
            nextTimeIdentifier = this.intervals.get(nextIndex).data;
        } else {
            this._nextIntervalIndex = -1;
        }
    }

    if (!isTimeDynamic || defined(currentTimeIdentifier)) {
        var currentImageryProvider = this._createImageryProvider(currentTimeIdentifier);
        this._imageryLayer = enableLayer(this, currentImageryProvider, this.opacity);
    }

    if (defined(nextTimeIdentifier)) {
        var nextImageryProvider = this._createImageryProvider(nextTimeIdentifier);

        // Do not allow picking from the preloading layer.
        nextImageryProvider._enablePickFeatures = false;

        this._nextLayer = enableLayer(this, nextImageryProvider, 0.0);
    }
};

ImageryLayerCatalogItem.prototype._disable = function() {
    disableLayer(this, this._imageryLayer);
    this._imageryLayer = undefined;

    disableLayer(this, this._nextLayer);
    this._nextLayer = undefined;
};

ImageryLayerCatalogItem.prototype._show = function() {
    show(this, this._imageryLayer);
    show(this, this._nextLayer);
};

ImageryLayerCatalogItem.prototype._hide = function() {
    hide(this, this._imageryLayer);
    hide(this, this._nextLayer);
};

ImageryLayerCatalogItem.prototype.pickFeaturesInLeaflet = function(mapExtent, mapWidth, mapHeight, pickX, pickY) {
    if (!defined(this.application.leaflet) || !defined(this._imageryLayer) || !defined(this._imageryLayer.imageryProvider)) {
        return undefined;
    }

    var map = this.application.leaflet.map;
    var imageryProvider = this._imageryLayer.imageryProvider;

    var projection = new WebMercatorProjection();
    var sw = projection.project(Rectangle.southwest(mapExtent));
    var ne = projection.project(Rectangle.northeast(mapExtent));

    // Compute the longitude and latitude of the pick location.
    var x = CesiumMath.lerp(sw.x, ne.x, pickX / (mapWidth - 1));
    var y = CesiumMath.lerp(ne.y, sw.y, pickY / (mapHeight - 1));

    var ll = projection.unproject(new Cartesian2(x, y));

    // Map the lon/lat to a tile in the current zoom level and query that tile for features.
    var level = Math.min(map.getZoom(), imageryProvider.maximumLevel);
    var tilingScheme = imageryProvider.tilingScheme;
    var tileCoordinates = tilingScheme.positionToTileXY(ll, level);
    if (!defined(tileCoordinates)) {
        return undefined;
    }

    return pollToPromise(function() {
        return imageryProvider.ready;
    }).then(function() {
        return imageryProvider.pickFeatures(tileCoordinates.x, tileCoordinates.y, level, ll.longitude, ll.latitude);
    });
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

function enableLayer(catalogItem, imageryProvider, opacity) {
    var result;

    if (defined(catalogItem.application.cesium)) {
        var scene = catalogItem.application.cesium.scene;

        var errorEvent = imageryProvider.errorEvent;

        if (defined(errorEvent)) {
            errorEvent.addEventListener(function(tileProviderError) {
                // We're only concerned about failures for tiles that actually overlap this item's extent.
                if (defined(catalogItem.rectangle)) {
                    var tilingScheme = imageryProvider.tilingScheme;
                    var tileExtent = tilingScheme.tileXYToRectangle(tileProviderError.x, tileProviderError.y, tileProviderError.level);
                    var intersection = Rectangle.intersection(tileExtent, catalogItem.rectangle);
                    if (!defined(intersection)) {
                        return;
                    }
                }

                if (defined(tileProviderError.error) && tileProviderError.error.statusCode === 404) {
                    if(!catalogItem.treat404AsError) {
                        return;
                    }
                    // ignoreUnknownTileErrors is only for genuinely unknown (no status code) issues
                } else if (catalogItem.ignoreUnknownTileErrors && (!defined(tileProviderError.error) || !defined(tileProviderError.error.statusCode))) {
                    return;
                }


                // Retry 3 times.
                if (tileProviderError.timesRetried < 3) {
                    tileProviderError.retry = true;
                    return;
                }

                // After three failures, advise the user that something is wrong and hide the catalog item.
                // (if the item isn't already hidden, that is)
                if (catalogItem.isShown) {
                    catalogItem.application.error.raiseEvent(new ModelError({
                        sender: catalogItem,
                        title: 'Error accessing catalogue item',
                        message: '\
An error occurred while attempting to download tiles for catalogue item ' + catalogItem.name + '.  This may indicate that there is a \
problem with your internet connection, that the catalogue item is temporarily unavailable, or that the catalogue item \
is invalid.  The catalogue item has been hidden from the map.  You may re-show it in the Now Viewing panel to try again.'
                    }));

                    catalogItem.isShown = false;
                }
            });
        }

        result = new ImageryLayer(imageryProvider, {
            show : false,
            alpha : opacity,
            rectangle : catalogItem.clipToRectangle ? catalogItem.rectangle : undefined
        });

        scene.imageryLayers.add(result);
    } else if (defined(catalogItem.application.leaflet)) {
        var options = {
            opacity: opacity,
            bounds : catalogItem.clipToRectangle && catalogItem.rectangle ? rectangleToLatLngBounds(catalogItem.rectangle) : undefined
        };

        result = new CesiumTileLayer(imageryProvider, options);
    }

    return result;
}

function disableLayer(catalogItem, layer) {
    if (!defined(layer)) {
        return;
    }

    if (defined(catalogItem.application.cesium)) {
        var scene = catalogItem.application.cesium.scene;
        scene.imageryLayers.remove(layer);
    } else if (defined(catalogItem.application.leaflet)) {
        var map = catalogItem.application.leaflet.map;
        map.removeLayer(layer);
    }
}

function updateClockSubscription(catalogItem) {
    if (catalogItem.isShown && defined(catalogItem.clock)) {
        // Subscribe
        if (!defined(catalogItem._clockTickSubscription)) {
            catalogItem._clockTickSubscription = catalogItem.application.clock.onTick.addEventListener(onClockTick.bind(undefined, catalogItem));
        }
    } else {
        // Unsubscribe
        if (defined(catalogItem._clockTickSubscription)) {
            catalogItem._clockTickSubscription();
            catalogItem._clockTickSubscription = undefined;
        }
    }
}

function onClockTick(catalogItem, clock) {
    var intervals = catalogItem.intervals;
    if (!defined(intervals) || !catalogItem.isEnabled || !catalogItem.isShown) {
        return;
    }

    var index = catalogItem._currentIntervalIndex;

    if (index < 0 || index >= intervals.length || !TimeInterval.contains(intervals.get(index), clock.currentTime)) {
        // Find the interval containing the current time.
        index = intervals.indexOf(clock.currentTime);
        if (index < 0) {
            // No interval contains this time, so do not show imagery at this time.
            disableLayer(catalogItem, catalogItem._imageryLayer);
            catalogItem._imageryLayer = undefined;
            catalogItem._currentIntervalIndex = -1;
            return;
        }

        // If the "next" layer is not applicable to this time, throw it away and create a new one.
        if (index !== catalogItem._nextIntervalIndex) {
            // Throw away the "next" layer, since it's not applicable.
            disableLayer(catalogItem, catalogItem._nextLayer);
            catalogItem._nextLayer = undefined;
            catalogItem._nextIntervalIndex = -1;

            // Create the new "next" layer
            var imageryProvider = catalogItem._createImageryProvider(catalogItem.intervals.get(index).data);
            imageryProvider._enablePickFeatures = false;
            catalogItem._nextLayer = enableLayer(catalogItem, imageryProvider, 0.0);
            show(catalogItem, catalogItem._nextLayer);
        }

        // At this point we can assume that _nextLayer is applicable to this time.
        // Make it visible
        setOpacity(catalogItem, catalogItem._nextLayer, catalogItem.opacity);
        fixNextLayerOrder(catalogItem);
        disableLayer(catalogItem, catalogItem._imageryLayer);

        catalogItem._imageryLayer = catalogItem._nextLayer;
        catalogItem._imageryLayer.imageryProvider._enablePickFeatures = true;
        catalogItem._nextLayer = undefined;
        catalogItem._nextIntervalIndex = -1;
        catalogItem._currentIntervalIndex = index;
    }

    // Prefetch the (predicted) next layer.
    var nextIndex = clock.multiplier >= 0.0 ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= intervals.length || nextIndex === catalogItem._nextIntervalIndex) {
        return;
    }

    var nextImageryProvider = catalogItem._createImageryProvider(catalogItem.intervals.get(nextIndex).data);
    nextImageryProvider._enablePickFeatures = false;
    catalogItem._nextLayer = enableLayer(catalogItem, nextImageryProvider, 0.0);
    show(catalogItem, catalogItem._nextLayer);
    catalogItem._nextIntervalIndex = nextIndex;
}

function setOpacity(catalogItem, layer, opacity) {
    if (!defined(layer)) {
        return;
    }

    if (defined(catalogItem.application.cesium)) {
        layer.alpha = opacity;
    }

    if (defined(catalogItem.application.leaflet)) {
        layer.setOpacity(opacity);
    }
}

function show(catalogItem, layer) {
    if (!defined(layer)) {
        return;
    }

    if (defined(catalogItem.application.cesium)) {
        layer.show = true;
    }

    if (defined(catalogItem.application.leaflet)) {
        if (!catalogItem.application.leaflet.map.hasLayer(layer)) {
            layer.addTo(catalogItem.application.leaflet.map);
        }
        catalogItem.application.nowViewing.updateLeafletLayerOrder();
    }
}

function hide(catalogItem, layer) {
    if (!defined(layer)) {
        return;
    }

    if (defined(catalogItem.application.cesium)) {
        layer.show = false;
    }

    if (defined(catalogItem.application.leaflet)) {
        catalogItem.application.leaflet.map.removeLayer(layer);
    }
}

function fixNextLayerOrder(catalogItem) {
    if (!defined(catalogItem._imageryLayer) || !defined(catalogItem._nextLayer)) {
        return;
    }

    if (defined(catalogItem.application.cesium)) {
        var imageryLayers = catalogItem.application.cesium.scene.imageryLayers;

        var currentIndex = imageryLayers.indexOf(catalogItem._imageryLayer);
        var nextIndex = imageryLayers.indexOf(catalogItem._nextLayer);
        if (currentIndex < 0 || nextIndex < 0) {
            return;
        }

        while (nextIndex < currentIndex - 1) {
            imageryLayers.raise(catalogItem._nextLayer);
            ++nextIndex;
        }

        while (nextIndex > currentIndex + 1) {
            imageryLayers.lower(catalogItem._nextLayer);
            --nextIndex;
        }
    }
}

module.exports = ImageryLayerCatalogItem;
