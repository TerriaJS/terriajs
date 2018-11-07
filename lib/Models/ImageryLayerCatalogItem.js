'use strict';

/*global require*/
var ClockRange =require('terriajs-cesium/Source/Core/ClockRange');
var clone = require('terriajs-cesium/Source/Core/clone');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var ImagerySplitDirection = require('terriajs-cesium/Source/Scene/ImagerySplitDirection');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var Resource = require('terriajs-cesium/Source/Core/Resource');
var retry = require('retry');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var CompositeCatalogItem = require('./CompositeCatalogItem');
var getUrlForImageryTile = require('../Map/getUrlForImageryTile');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var { setOpacity, fixNextLayerOrder } = require('./ImageryLayerPreloadHelpers');
var setClockCurrentTime = require('./setClockCurrentTime');
var ChartData = require('../Charts/ChartData');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var WebMercatorProjection = require('terriajs-cesium/Source/Core/WebMercatorProjection');
var URI = require('urijs');
var loadJson = require('../Core/loadJson');
/**
 * A {@link CatalogItem} that is added to the map as a rasterized imagery layer.
 *
 * @alias ImageryLayerCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var ImageryLayerCatalogItem = function(terria) {
     CatalogItem.call(this, terria);

    this._imageryLayer = undefined;
    this._clock = undefined;
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
     * Gets or sets a value indicating whether a 403 response code when requesting a tile should be
     * treated as an error.  If false, 403s are assumed to just be missing tiles and need not be
     * reported to the user.
     * @type {Boolean}
     * @default false
     */
    this.treat403AsError = true;

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

    /**
     * Gets or sets the {@link TimeIntervalCollection} defining the intervals of distinct imagery available at some specific
     * location..  If this catalog item is not time-dynamic, property is undefined.  This property is observable.
     * @type {ImageryLayerInterval[]}
     * @default undefined
     */
    this.localizedIntervals = undefined;

    /**
     * Keeps the layer on top of all other imagery layers.  This property is observable.
     * @type {Boolean}
     * @default false
     */
    this.keepOnTop = false;

    /**
     * Gets or sets a value indicating whether this dataset should be clipped to the {@link CatalogItem#rectangle}.
     * If true, no part of the dataset will be displayed outside the rectangle.  This property is true by default,
     * leading to better performance and avoiding tile request errors that might occur when requesting tiles outside the
     * server-specified rectangle.  However, it may also cause features to be cut off in some cases, such as if a server
     * reports an extent that does not take into account that the representation of features sometimes require a larger
     * spatial extent than the features themselves.  For example, if a point feature on the edge of the extent is drawn
     * as a circle with a radius of 5 pixels, half of that circle will be cut off.
     * @type {Boolean}
     * @default false
     */
    this.clipToRectangle = true;

    /**
     * Gets or sets a value indicating whether tiles of this catalog item are required to be loaded before terrain
     * tiles to which they're attached can be rendered.  This should usually be set to true for base layers and
     * false for all others.
     * @type {Boolean}
     * @default false
     */
    this.isRequiredForRendering = false;

    /**
     * Options for the value of the animation timeline at start. Valid options in config file are:
     *     initialTimeSource: "present"                            // closest to today's date
     *     initialTimeSource: "start"                              // start of time range of animation
     *     initialTimeSource: "end"                                // end of time range of animation
     *     initialTimeSource: An ISO8601 date e.g. "2015-08-08"    // specified date or nearest if date is outside range
     * @type {String}
     */
    this.initialTimeSource = undefined;

    /**
     * Gets or sets which side of the splitter (if present) to display this imagery layer on.  Defaults to both sides.
     * This property is observable.
     * @type {ImagerySplitDirection}
     */
    this.splitDirection = ImagerySplitDirection.NONE;  // NONE means show on both sides of the splitter, if there is one.

    /**
     * Whether to show imagery availability on charts.
     * @type {Boolean}
     * @default false
     */
    this.showOnChart = false;

    /**
     * Whether this layer is sufficient to warrant a chart.
     * @type {Boolean}
     * @default true
     */
    this.dontChartAlone = true;

    /**
     * A WMS service which will be called to get more accurate imagery availability for the currently selected feature.
     * {
     *     url: ...          // base URL of WMS server
     *     layers: ...       // "layers" parameter passed to WMS
     *     queryLayers:      // "query_layers" paremeter passed to WMS, defaults to layers value.
     *     hourOffset: 14    // how many hours to add to the given date stamp
     *     dateProperty: "data_available_for_utc_dates" // name of the property on each featuring containing an array of dates
     * 
     * }
     */
    this.localizedAvailabilityService = undefined;

    /* The location that imagery localization is currently based off. */
    this._localizedPosition = undefined;

    // Need to track initialTimeSource so we can set it in the specs after setting intervals, and then have the current time update (via the clock property).
    knockout.track(this, ['_clock', 'opacity', 'treat404AsError', 'ignoreUnknownTileErrors', 'intervals', 'clipToRectangle', 'splitDirection', 'initialTimeSource', 'localizedIntervals']);

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

                clock = new DataSourceClock();
                clock.startTime = startTime;
                clock.stopTime = stopTime;
                clock.multiplier = timePerSecond;

                setClockCurrentTime(clock, this.initialTimeSource);
            }
            return clock;
        },
        set : function(value) {
            this._clock = value;
        }
    });

    /**
     * Gets javascript dates describing the discrete datetimes (or intervals) available for this item.
     * By declaring this as a knockout defined property, it is cached.
     * @member {Date[]} An array of discrete dates or intervals available for this item, or [] if none.
     * @memberOf ImageryLayerCatalogItem.prototype
     */
    knockout.defineProperty(this, 'availableDates', {
        get: function() {

            const intervals = defaultValue(this.localizedIntervals, this.intervals);
            if (defined(intervals)) {
                // Only show the start of each interval. If only time instants were given, this is the instant.
                const datetimes = [];
                for (let i = 0; i < intervals.length; i++) {
                    datetimes.push(JulianDate.toDate(intervals.get(i).start));
                }
                return datetimes;
            }
            return [];
        }
    }, this);

    knockout.getObservable(this, 'opacity').subscribe(function() {
        updateOpacity(this);
    }, this);

    knockout.getObservable(this, 'splitDirection').subscribe(function() {
        updateSplitDirection(this);
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
            return !this.keepOnTop;
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
     * Gets a value indicating whether this layer can be split so that it is
     * only shown on the left or right side of the screen.
     * @memberOf ImageryLayerCatalogItem.prototype
     */
    supportsSplitting : {
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
     * When a property name on the model matches the name of a property in the serializers object literal,
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
     * for a share link.
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
        throw new TerriaError({
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

ImageryLayerCatalogItem.defaultUpdaters.availableDates = function() {
    // Do not update/serialize availableDates.
};

freezeObject(ImageryLayerCatalogItem.defaultUpdaters);

ImageryLayerCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

ImageryLayerCatalogItem.defaultSerializers.intervals = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.intervals)) {
        var result = [];
        for (var i = 0; i < catalogItem.intervals.length; ++i) {
            var interval = catalogItem.intervals.get(i);
            result.push({
                interval: TimeInterval.toIso8601(interval),
                data: interval.data
            });
        }
        json.intervals = result;
    }
};

// Do not serialize the original intialTimeSource - serialize the current time.
// That way if the item is shared, the desired time is used.
ImageryLayerCatalogItem.defaultSerializers.initialTimeSource = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.clock)) {
        json.initialTimeSource = JulianDate.toIso8601(catalogItem.clock.currentTime);
    } else {
        json.initialTimeSource = catalogItem.initialTimeSource;
    }
};

ImageryLayerCatalogItem.defaultSerializers.clock = function() {
    // Do not serialize the clock when duplicating the item.
    // Since this is not shared, it is not serialized for sharing anyway.
};

ImageryLayerCatalogItem.defaultSerializers.availableDates = function() {
    // Do not update/serialize availableDates.
};

freezeObject(ImageryLayerCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
ImageryLayerCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
ImageryLayerCatalogItem.defaultPropertiesForSharing.push('opacity');
ImageryLayerCatalogItem.defaultPropertiesForSharing.push('keepOnTop');
ImageryLayerCatalogItem.defaultPropertiesForSharing.push('initialTimeSource');
ImageryLayerCatalogItem.defaultPropertiesForSharing.push('splitDirection');

freezeObject(ImageryLayerCatalogItem.defaultPropertiesForSharing);

/**
 * Creates the {@link ImageryProvider} for this catalog item.
 * @param {ImageryLayerTime} [time] The time for which to create an imagery provider.  In layers that are not time-dynamic,
 *                                  this parameter is ignored.
 * @return {ImageryProvider} The created imagery provider.
 */
ImageryLayerCatalogItem.prototype.createImageryProvider = function(time) {
    var result = this._createImageryProvider(time);
    return result;
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

ImageryLayerCatalogItem.prototype._enable = function(layerIndex) {
    var item = this;
    if (defined(this._imageryLayer)) {
        return;
    }
    var isTimeDynamic = defined(this.intervals) && (this.intervals.length > 0) && defined(this.clock);
    var currentTimeIdentifier;
    var nextTimeIdentifier;

    if (isTimeDynamic) {
        var index = this.intervals.indexOf(this.clock.currentTime);

        // Here we use the terria clock because we want to optomise for the case where the item is playing on the
        // timeline (which is linked to the terria clock) and preload the layer at the next time that the timeslider
        // will move to.
        const multiplier = this.terria.clock.multiplier;

        var nextIndex;
        if (index < 0) {
            // No imagery matches the current time. ~index is the next available time.
            this._currentIntervalIndex = -1;
            nextIndex = ~index + (multiplier < 0.0 ? -1 : 0);
        } else {
            // There is imagery for the current time
            this._currentIntervalIndex = index;
            currentTimeIdentifier = this.intervals.get(index).data;

            nextIndex = index + (multiplier < 0.0 ? -1 : 1);
        }

        // Ideally we should also check (this.terria.clock.clockRange === ClockRange.LOOP_STOP) here (to save preloading
        // where it won't be used), but due to initaliseation order this.terria.clock.clockRange is not necessarily in
        // the state that it will be when nextIndex is needed. So we make the assumption that this is the most likely
        // case and optomise for this (since for the other cases UNBOUNDED / CLAMPED there is nothing to effectively preload).
        if (nextIndex === this.intervals.length) {
            nextIndex = 0;
        }

        if (nextIndex >= 0 && nextIndex < this.intervals.length) {
            this._nextIntervalIndex = nextIndex;
            nextTimeIdentifier = this.intervals.get(nextIndex).data;
        } else {
            this._nextIntervalIndex = -1;
        }

        this._currentTimeSubscription = knockout.getObservable(this, 'currentTime').subscribe(function() {
            onClockTick(this);
        }, this);

        if (this.localizedAvailabilityService) {
            knockout.getObservable(item.terria, 'selectedFeature').subscribe(() => updateAvailabilityFromLocalizedAvailabilityService(this));
        }
    }

    if (!isTimeDynamic || defined(currentTimeIdentifier)) {
        var currentImageryProvider = this.createImageryProvider(currentTimeIdentifier);
        this._imageryLayer = ImageryLayerCatalogItem.enableLayer(this, currentImageryProvider, this.opacity, layerIndex);
    }

    if (defined(nextTimeIdentifier)) {
        var nextImageryProvider = this.createImageryProvider(nextTimeIdentifier);

        // Do not allow picking from the preloading layer.
        nextImageryProvider.enablePickFeatures = false;

        this._nextLayer = ImageryLayerCatalogItem.enableLayer(this, nextImageryProvider, 0.0, layerIndex + 1);
    }
    updateSplitDirection(this);
};

ImageryLayerCatalogItem.prototype._disable = function() {
    if (defined(this._currentTimeSubscription)) {
        this._currentTimeSubscription.dispose();
        this._currentTimeSubscription = undefined;
    }

    ImageryLayerCatalogItem.disableLayer(this, this._imageryLayer);
    this._imageryLayer = undefined;

    ImageryLayerCatalogItem.disableLayer(this, this._nextLayer);
    this._nextLayer = undefined;
};

ImageryLayerCatalogItem.prototype._show = function() {
    // When the layer is not shown .showDataForTime() has no effect so if someone has updated the currentTime while the
    // item was not shown update the layer now.
    showDataForTime(this, this.currentTime);

    ImageryLayerCatalogItem.showLayer(this, this._imageryLayer);
    ImageryLayerCatalogItem.showLayer(this, this._nextLayer);
        
    const needUpdate = this.localizedAvailabilityService && !this.localizedIntervals;
    // if we don't have localized availability yet, get that first.
    when (needUpdate ? updateAvailabilityFromLocalizedAvailabilityService(this) : true)
    .then(() => {
        if (this.showOnChart) {
            this.xAxis = 'time';
            this.terria.catalog.addChartableItem(this);
        }
    });

};

ImageryLayerCatalogItem.prototype._hide = function() {
    ImageryLayerCatalogItem.hideLayer(this, this._imageryLayer);
    ImageryLayerCatalogItem.hideLayer(this, this._nextLayer);
    if (this.showOnChart) {
        this.terria.catalog.removeChartableItem(this);
    }
};

ImageryLayerCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
    var imageryProvider = this._createImageryProvider();
    var layer = ImageryLayerCatalogItem.enableLayer(this, imageryProvider, this.opacity, undefined, globeOrMap);
    globeOrMap.updateItemForSplitter(this);  // equivalent to updateSplitDirection(catalogItem), but for any viewer (globeOrMap).
    ImageryLayerCatalogItem.showLayer(this, layer, globeOrMap);

    var that = this;
    return function() {
        ImageryLayerCatalogItem.hideLayer(that, layer, globeOrMap);
        ImageryLayerCatalogItem.disableLayer(that, layer, globeOrMap);
    };
};

/**
 * Refreshes this layer on the map.  This is useful when, for example, parameters that went into
 * {@link ImageryLayerCatalogItem#_createImageryProvider} change.
 */
ImageryLayerCatalogItem.prototype.refresh = function() {
    if (!defined(this._imageryLayer)) {
        return;
    }

    var currentIndex;
    if (defined(this.terria.cesium)) {
        var imageryLayers = this.terria.cesium.scene.imageryLayers;
        currentIndex = imageryLayers.indexOf(this._imageryLayer);
    }

    this._hide();
    this._disable();

    if (this.isEnabled) {
        this._enable(currentIndex);
        if (this.isShown) {
            this._show();
        }
    }

    this.terria.currentViewer.notifyRepaintRequired();
};

function updateOpacity(item) {
    if (defined(item._imageryLayer) && item.isEnabled && item.isShown) {
        if (defined(item._imageryLayer.alpha)) {
            item._imageryLayer.alpha = item.opacity;
        }
        if (defined(item._imageryLayer.setOpacity)) {
            item._imageryLayer.setOpacity(item.opacity);
        }
        item.terria.currentViewer.notifyRepaintRequired();
    }
}

function updateSplitDirection(item) {
    item.terria.currentViewer.updateItemForSplitter(item);
}

ImageryLayerCatalogItem.enableLayer = function(catalogItem, imageryProvider, opacity, layerIndex, globeOrMap) {
    globeOrMap = defaultValue(globeOrMap, catalogItem.terria.currentViewer);

    let tileFailures = 0;
    let tileRetriesByMap = {};

    const layer = globeOrMap.addImageryProvider({
        imageryProvider: imageryProvider,
        rectangle: catalogItem.rectangle,
        clipToRectangle: catalogItem.clipToRectangle,
        opacity: opacity,
        layerIndex: layerIndex,
        treat403AsError: catalogItem.treat403AsError,
        treat404AsError: catalogItem.treat404AsError,
        ignoreUnknownTileErrors: catalogItem.ignoreUnknownTileErrors,
        isRequiredForRendering: catalogItem.isRequiredForRendering,
        /*
          Handling tile errors is really complicated because:
          1) things go wrong for a variety of weird reasons including server misconfiguration, servers that are flakey but not totally broken, etc.
          2) we want to fail as gracefully as possible, and give flakey servers every chance chance to shine
          3) we don't generally have enough information the first time something fails.
          
          There are several mechanisms in play here:
          - Cesium's Resource automatically keeps trying to load any resource that fails until told to stop, but tells us each time.
          - The "retry" library knows how to pace the retries, and when to actually stop.
        */
        onLoadError: function(tileProviderError) {
            if (!defined(layer) || !globeOrMap.isImageryLayerShown({layer})) {
                // If the layer is no longer shown, ignore errors and don't retry.
                return undefined;
            }

            if (tileProviderError.timesRetried === 0) {
                // There was an intervening success, so restart our count of the tile failures.
                tileFailures = 0;
                tileRetriesByMap = {};
            }

            tileProviderError.retry = undefined;

            // deferred.reject = stop trying to load this tile
            // deferred.resolve = retry loading this tile
            const deferred = when.defer();

            // operation has methods attempt, retry, stop.
            const operation = retry.operation({
                retries: 8,
                minTimeout: 200,
                randomize: true
            });

            let error = tileProviderError.error;

            function fetchImage() {
                // Attempt to fetch the image again.
                const tileUrl = getUrlForImageryTile(imageryProvider, tileProviderError.x, tileProviderError.y, tileProviderError.level);
                if (tileUrl) {
                    return Resource.fetchImage({
                        url: tileUrl,
                        preferBlob: true
                    });
                } else {
                    // We can't get a URL, so we can't retry this. Let it fail with an unknown error.
                    return when.reject();
                }
            }

            function tellMapToRetry() {
                operation.stop();
                deferred.resolve();
            }

            function tellMapToSilentlyGiveUp() {
                operation.stop();
                deferred.reject();
            }

            function retryWithBackoff(e) {
                // Clear the existing error.
                error = undefined;

                if (!operation.retry(e)) {
                    failTile(e);
                }
            }

            // Give up loading this (definitively, unexpectedly bad) tile and possibly give up on this layer entirely.
            function failTile(e) {
                ++tileFailures;

                if (tileFailures > 5 && defined(layer) && globeOrMap.isImageryLayerShown({layer})) {
                    // Too many failures, display an error message and hide the layer.
                    if (catalogItem === catalogItem.terria.baseMap ||
                        catalogItem.terria.baseMap instanceof CompositeCatalogItem && catalogItem.terria.baseMap.items.indexOf(catalogItem) >= 0) {

                        globeOrMap.terria.error.raiseEvent(new TerriaError({
                            sender: catalogItem,
                            title: 'Error accessing base map',
                            message:
                                'An error occurred while attempting to download tiles for base map:<p><center>' + catalogItem.terria.baseMap.name + '</center></p> This may indicate that there is a ' +
                                'problem with your internet connection, that the base map is temporarily unavailable, or that the base map ' +
                                'is invalid.  Please select a different base map using the Map button in the top-right corner.  Further technical details may be found below.<br/><br/>' +
                                '<pre>' + formatError(e) + '</pre>'
                        }));

                        globeOrMap.hideImageryLayer({
                            layer: layer
                        });
                        catalogItem.terria.baseMap = undefined;

                        // Don't use this base map again on startup.
                        catalogItem.terria.setLocalProperty('basemap', undefined);
                    } else {
                        globeOrMap.terria.error.raiseEvent(new TerriaError({
                            sender: catalogItem,
                            title: 'Error accessing catalogue item',
                            message:
                                'An error occurred while attempting to download tiles for catalogue item:<p><center>' + catalogItem.name + '</center></p> This may indicate that there is a ' +
                                'problem with your internet connection, that the catalogue item is temporarily unavailable, or that the catalogue item ' +
                                'is invalid.  The catalogue item has been hidden from the map.  You may re-show it in the Now Viewing panel to try again.  Further technical details may be found below.<br/><br/>' +
                                '<pre>' + formatError(e) + '</pre>'
                        }));

                        if (globeOrMap === catalogItem.terria.currentViewer) {
                            catalogItem.isShown = false;
                        } else {
                            globeOrMap.hideImageryLayer({
                                layer: layer
                            });
                        }
                    }
                }

                tellMapToSilentlyGiveUp();
            }

            operation.attempt(function() {
                if (!defined(layer) || !globeOrMap.isImageryLayerShown({layer})) {
                    // If the layer is no longer shown, ignore errors and don't retry.
                    tellMapToSilentlyGiveUp();
                    return;
                }

                // Browsers don't tell us much about a failed image load, so we do an XHR to get more information if needed.
                let maybeXhr = defined(error) && defined(error.statusCode) ? when.reject(error) : fetchImage();
                if (catalogItem.handleTileError !== undefined) {
                    // Give the catalog item a chance to handle this error.
                    maybeXhr = catalogItem.handleTileError(maybeXhr, imageryProvider, tileProviderError.x, tileProviderError.y, tileProviderError.level);
                }

                maybeXhr.then(function() {
                    // Be careful: it's conceivable that a request here will always succeed while a request made by the map will
                    // always fail, e.g. as a result of different request headers. We must not get stuck repeating the request
                    // forever in that scenario. Instead, we should give up after a few attempts.
                    const key = `L${tileProviderError.level}X${tileProviderError.x}Y${tileProviderError.y}`;
                    tileRetriesByMap[key] = tileRetriesByMap[key] || 0;

                    if (++tileRetriesByMap[key] > 5) {
                        failTile({
                            name: 'Tile Error',
                            message: 'The tile with the URL:\n' +
                                     getUrlForImageryTile(imageryProvider, tileProviderError.x, tileProviderError.y, tileProviderError.level) + '\n' +
                                     'succeeded when loaded with XMLHttpRequest but failed multiple times when loaded directly by Cesium or Leaflet.\n' +
                                     'This may indicate that the server is very sensitive to the request headers provided or is simply unreliable.'
                        });
                    } else {
                        // Either:
                        // - the XHR request for more information surprisingly worked this time, let's hope the good luck continues when Cesium/Leaflet retries.
                        // - the ImageryCatalogItem looked at the error and said we should try again.
                        tellMapToRetry();
                    }
                }).otherwise(function(e) {
                    // This attempt failed. We'll either retry or give up depending on the status code.
                    e = e || {};

                    // We're only concerned about failures for tiles that actually overlap this item's extent.
                    if (defined(catalogItem.rectangle)) {
                        var tilingScheme = imageryProvider.tilingScheme;
                        var tileExtent = tilingScheme.tileXYToRectangle(tileProviderError.x, tileProviderError.y, tileProviderError.level);
                        var intersection = Rectangle.intersection(tileExtent, catalogItem.rectangle);
                        if (!defined(intersection)) {
                            tellMapToSilentlyGiveUp();
                            return;
                        }
                    }

                    if (e.statusCode >= 400 && e.statusCode < 500) {
                        if (catalogItem.treat404AsError === false && e.statusCode === 404) {
                            tellMapToSilentlyGiveUp();
                        } else if (catalogItem.treat403AsError === false && e.statusCode === 403) {
                            tellMapToSilentlyGiveUp();
                        } else {
                            // Server doesn't like what we're asking for or how we're asking. Very unlikely to get better.
                            failTile(e);
                        }
                    } else if (e.statusCode >= 500 && e.statusCode < 600) {
                        // Poor server is stressed maybe. Wait and then retry.
                        retryWithBackoff(e);
                    } else if (!defined(e.statusCode) && defined(e.target)) {
                        // This is a failed image element, which means we got a 200 response but
                        // could not load it as an image.
                        failTile({
                            name: 'Tile Error',
                            message: 'Got a 200 (OK) response from URL:\n' +
                                     getUrlForImageryTile(imageryProvider, tileProviderError.x, tileProviderError.y, tileProviderError.level) + '\n' +
                                     'but it could not be loaded as an image.'
                        });
                    } else if (!defined(e.statusCode)) {
                        // On a modern-ish browser, this is probably a CORS problem, but can also be a
                        // domain name lookup failure or a general network failure.
                        // Note that ignoreUnknownTileErrors is only for genuinely unknown (no status code) errors.
                        if (catalogItem.ignoreUnknownTileErrors) {
                            tellMapToSilentlyGiveUp();
                        } else {
                            failTile({
                                name: 'Unknown Tile Error',
                                message: 'While accessing URL:\n' +
                                         getUrlForImageryTile(imageryProvider, tileProviderError.x, tileProviderError.y, tileProviderError.level) + '\n' +
                                         'This probably indicates one of the following:\n' +
                                         '* The server hostname could not be resolved,\n' +
                                         '* The server did not respond to the request, or\n' +
                                         '* The server denied Cross-Origin Resource Sharing (CORS) access to this URL (See https://docs.terria.io/guide/connecting-to-data/cross-origin-resource-sharing/).'
                            });
                        }
                    } else {
                        // Some HTTP error other than 4xx or 5xx
                        failTile(e);
                    }
                });
            });

            tileProviderError.retry = deferred.promise;
        },
        onProjectionError: function() {
            // If the TileLayer experiences an error, hide the catalog item and inform the user.
            globeOrMap.terria.error.raiseEvent({
                sender: catalogItem,
                title: 'Unable to display dataset',
                message:
                    catalogItem.name + '" cannot be shown in 2D because it does not support the standard Web Mercator (EPSG:3857) projection.  ' +
                    'Please switch to 3D if it is supported on your system, update the dataset to support the projection, or use a different dataset.'
            });

            if (globeOrMap === catalogItem.terria.currentViewer) {
                catalogItem.isShown = false;
            } else {
                globeOrMap.hideImageryLayer({
                    layer: layer
                });
            }
        }
    });

    return layer;
};

ImageryLayerCatalogItem.disableLayer = function(catalogItem, layer, globeOrMap) {
    if (!defined(layer)) {
        return;
    }

    globeOrMap = defaultValue(globeOrMap, catalogItem.terria.currentViewer);
    globeOrMap.removeImageryLayer({
        layer: layer
    });
};

function showDataForTime(catalogItem, currentTime, preloadNext) {
    if (!defined(currentTime)) {
        return;
    }

    var intervals = catalogItem.intervals;
    if (!defined(intervals) || !catalogItem.isEnabled || !catalogItem.isShown) {
        return;
    }
    const preload = defaultValue(preloadNext, true);
    var index = catalogItem._currentIntervalIndex;

    if (index < 0 || index >= intervals.length || !TimeInterval.contains(intervals.get(index), currentTime)) {
        // Find the interval containing the current time.
        index = intervals.indexOf(currentTime);
        if (index < 0) {
            // No interval contains this time, so do not show imagery at this time.
            ImageryLayerCatalogItem.disableLayer(catalogItem, catalogItem._imageryLayer);
            catalogItem._imageryLayer = undefined;
            catalogItem._currentIntervalIndex = -1;
            return;
        }
        // If the "next" layer is not applicable to this time, throw it away and create a new one.
        if (index !== catalogItem._nextIntervalIndex) {
            // Throw away the "next" layer, since it's not applicable.
            ImageryLayerCatalogItem.disableLayer(catalogItem, catalogItem._nextLayer);
            catalogItem._nextLayer = undefined;
            catalogItem._nextIntervalIndex = -1;

            // Create the new "next" layer
            var imageryProvider = catalogItem.createImageryProvider(catalogItem.intervals.get(index).data);
            imageryProvider.enablePickFeatures = false;
            catalogItem._nextLayer = ImageryLayerCatalogItem.enableLayer(catalogItem, imageryProvider, 0.0);
            updateSplitDirection(catalogItem);
            ImageryLayerCatalogItem.showLayer(catalogItem, catalogItem._nextLayer);
        }

        // At this point we can assume that _nextLayer is applicable to this time.
        // Make it visible
        setOpacity(catalogItem, catalogItem._nextLayer, catalogItem.opacity);
        fixNextLayerOrder(catalogItem, catalogItem._imageryLayer, catalogItem._nextLayer);
        ImageryLayerCatalogItem.disableLayer(catalogItem, catalogItem._imageryLayer);
        catalogItem._imageryLayer = catalogItem._nextLayer;
        if (defined(catalogItem._nextLayer))
        {
            catalogItem._imageryLayer.imageryProvider.enablePickFeatures = true;
        }
        catalogItem._nextLayer = undefined;
        catalogItem._nextIntervalIndex = -1;
        catalogItem._currentIntervalIndex = index;

        if (preload) {
            // Prefetch the (predicted) next layer.
            // Here we use the terria clock because we want to optomise for the case where the item is playing on the
            // timeline (which is linked to the terria clock) and preload the layer at the next time that the timeslider
            // will move to.
            var nextIndex = catalogItem.terria.clock.multiplier >= 0.0 ? index + 1 : index - 1;
            if ((nextIndex === intervals.length) && (catalogItem.terria.clock.clockRange === ClockRange.LOOP_STOP)) {
                nextIndex = 0;
            }
            if (nextIndex >= 0 && nextIndex < intervals.length && nextIndex !== catalogItem._nextIntervalIndex) {
                var nextImageryProvider = catalogItem.createImageryProvider(catalogItem.intervals.get(nextIndex).data);
                nextImageryProvider.enablePickFeatures = false;
                catalogItem._nextLayer = ImageryLayerCatalogItem.enableLayer(catalogItem, nextImageryProvider, 0.0);
                updateSplitDirection(catalogItem);
                ImageryLayerCatalogItem.showLayer(catalogItem, catalogItem._nextLayer);
                catalogItem._nextIntervalIndex = nextIndex;
            }
        }
    }
}

function onClockTick(catalogItem) {
    var intervals = catalogItem.intervals;
    if (!defined(intervals) || !catalogItem.isEnabled || !catalogItem.isShown || !defined(catalogItem.clock)) {
        return;
    }
    showDataForTime(catalogItem, catalogItem.clock.currentTime);
}



ImageryLayerCatalogItem.showLayer = function(catalogItem, layer, globeOrMap) {
    if (!defined(layer)) {
        return;
    }

    globeOrMap = defaultValue(globeOrMap, catalogItem.terria.currentViewer);
    globeOrMap.showImageryLayer({
        layer: layer
    });
};

ImageryLayerCatalogItem.hideLayer = function(catalogItem, layer, globeOrMap) {
    if (!defined(layer)) {
        return;
    }

    globeOrMap = defaultValue(globeOrMap, catalogItem.terria.currentViewer);
    globeOrMap.hideImageryLayer({
        layer: layer
    });
};
/**
 * 
 * @param {IntervalCollection} intervals Set of intervals to snap to.
 * @param {JulianDate} time 
 * @return {JulianDate} Nearest start or end of an interval.
 */
ImageryLayerCatalogItem.snapNearestAvailableTime = function(intervals, time) {
    // note: not considering whether start/end included in each interval, for now.
    const index = intervals.indexOf(time);
    if (intervals.length === 0) {
        // probably never happens
        return intervals.get(0).start;
    } else if (~index === intervals.length) {
        // after the last interval, snap to the end
        return intervals.get(intervals.length - 1).stop;
    } else if (index === -1) {
        // before the first interval, go to its start.
        return intervals.get(~index).start;
    } else if (index < 0) {
        // in a gap between two intervals
        const prev = intervals.get(~index - 1).stop;
        const next = intervals.get(~index).start;
        if (JulianDate.secondsDifference(time, prev) < JulianDate.secondsDifference(next, time)) {
            return prev;
        } else {
            return next;
        }
    } else {
        const interval = intervals.get(index);
        if (JulianDate.secondsDifference(time, interval.start) < JulianDate.secondsDifference(interval.stop, time)) {
            return interval.start;
        } else {
            return interval.stop;
        }
    }
};

/**
 * Return the imagery availability dates as a data series for charting.
 */
ImageryLayerCatalogItem.prototype.chartData = function () {
    const points = this.availableDates.map(date => ({ x: date, y: 1 }));
    const item = this;
    return new ChartData(points,
        {
            id: this.uniqueid + '-availability',
            name: this.name,
            categoryName: this.name,
            type: 'moment',
            showAll: false,   // availability is not important enough to expand the chart for it.
            yAxisMin: 0,
            yAxisMax: 1,
            onClick: (time) => {
                // Problem: if multiple imagery layers are on the chart, snapping will only work for one of them.
                item.currentTime = ImageryLayerCatalogItem.snapNearestAvailableTime(defaultValue(item.localizedIntervals, item.intervals), JulianDate.fromDate(time));
                showDataForTime(item, item.currentTime);
            }
        });
};

// User has clicked on a thing. Use that thing's location to find out what imagery is available at that specific location.
function updateAvailabilityFromLocalizedAvailabilityService(item) {
    function datesToTimeIntervalCollection(dates, hourOffset = 0)  {
        const intervals = new TimeIntervalCollection();
        dates.forEach((date, i) => {
            let start = JulianDate.fromIso8601(date);
            start = JulianDate.addHours(start, hourOffset, new JulianDate()); 
            const stop = JulianDate.addHours(start, 0.1, new JulianDate()); // a satellite pass is probably actually valid for a day but this seems to work better
            intervals.addInterval(new TimeInterval({
                start: start,
                stop: stop
            }));
        });
        return intervals;
    }

    function getBbox() {
        // To get info for a specific location we make a tiny bounding box, with a corner at the selected feature
        const posRads = Ellipsoid.WGS84.cartesianToCartographic(item._localizedPosition.getValue());
        const projCoords = (new WebMercatorProjection()).project(posRads);
        return [projCoords.x, projCoords.y, projCoords.x + 0.01, projCoords.y + 0.01].toString();
    }

    const las = item.localizedAvailabilityService;
    if (!defined(las)) {
        return;
    } else if (!defined(item.terria.selectedFeature) || !defined(item.terria.selectedFeature.position)) {
        // Note: Currently we never reset item.localizedIntervals to undefined.
        item._localizedPosition = undefined;
        return;
    } else if (item.terria.selectedFeature.position === item._localizedPosition) {
        // Nothing has actually changed, let's save the expensive call.
        return;
    }
    item._localizedPosition = item.terria.selectedFeature.position;

    const uri = new URI(las.url)
        .search({
            service: 'WMS',
            version: '1.1.1',
            request: 'GetFeatureInfo',
            layers: las.layers,
            query_layers: defaultValue(las.queryLayers, las.layers),
            srs: 'EPSG:3857',
            bbox: getBbox(),
            width: 256,
            height: 256,
            x: 0,
            y: 0,
            info_format: 'application/json',
        }).toString();

    return loadJson(uri).then(featureCollection => {
        try {
            const dateProp = defaultValue(las.dateProperty, 'data_available_for_dates'); 
            const dates = featureCollection.features[0].properties[dateProp];
            item.localizedIntervals = datesToTimeIntervalCollection(dates, las.hourOffset);
        } catch (e) {
            // This kind of error is probably not worth bothering the user about.
            item.localizedIntervals = undefined;
            console.error(e);
        }
    });
}

module.exports = ImageryLayerCatalogItem;
