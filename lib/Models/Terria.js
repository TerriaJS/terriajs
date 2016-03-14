"use strict";

/*global require*/
var URI = require('urijs');

var buildModuleUrl = require('terriajs-cesium/Source/Core/buildModuleUrl');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var Clock = require('terriajs-cesium/Source/Core/Clock');
var combine = require('terriajs-cesium/Source/Core/combine');
var DataSourceCollection = require('terriajs-cesium/Source/DataSources/DataSourceCollection');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var queryToObject = require('terriajs-cesium/Source/Core/queryToObject');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CameraView = require('./CameraView');
var Catalog = require('./Catalog');
var ConsoleAnalytics = require('../Core/ConsoleAnalytics');
var corsProxy = require('../Core/corsProxy');
var GoogleAnalytics = require('../Core/GoogleAnalytics');
var NowViewing = require('./NowViewing');
var Services = require('./Services');
var ViewerMode = require('./ViewerMode');
var NoViewer = require('./NoViewer');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var TimeSeriesStack = require('./TimeSeriesStack');

var defaultConfigParameters = {
    defaultMaximumShownFeatureInfos: 100,
    /* These services are not included within Terria, but this is where we expect them to be, by default. */
    regionMappingDefinitionsUrl: 'data/regionMapping.json',
    conversionServiceBaseUrl: 'convert/',
    proj4ServiceBaseUrl: 'proj4/',
    corsProxyBaseUrl: 'proxy/'
};

/**
 * The overall model for TerriaJS.
 * @alias Terria
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.baseUrl The base directory in which TerriaJS can find its static assets.
 * @param {String} [options.cesiumBaseUrl='(options.baseUrl)/build/Cesium/build/'] The base directory in which Cesium can find its static assets.
 * @param {String} [options.appName] The name of the app.
 * @param {String} [options.supportEmail] The support email for the app.
 */
var Terria = function(options) {
    // IE9 doesn't have a console object until the debugging tools are opened.
    // Add a shim.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {},
            warn : function() {}
        };
    }

    if (!defined(options) || !defined(options.baseUrl)) {
        throw new DeveloperError('options.baseUrl is required.');
    }

    this.baseUrl = defaultValue(options.baseUrl, 'build/TerriaJS/');
    if (this.baseUrl.lastIndexOf('/') !== this.baseUrl.length - 1) {
        this.baseUrl += '/';
    }

    var cesiumBaseUrl = defaultValue(options.cesiumBaseUrl, this.baseUrl + 'build/Cesium/build/');
    if (cesiumBaseUrl.lastIndexOf('/') !== cesiumBaseUrl.length - 1) {
        cesiumBaseUrl += '/';
    }
    this.cesiumBaseUrl = cesiumBaseUrl;
    buildModuleUrl.setBaseUrl(cesiumBaseUrl);

    /**
     * Gets or sets the instance to which to report Google Analytics-style log events.
     * If a global `ga` function is defined, this defaults to `GoogleAnalytics`.  Otherwise, it defaults
     * to `ConsoleAnalytics`.
     * @type {ConsoleAnalytics|GoogleAnalytics}
     */
    this.analytics = options.analytics;
    if (!defined(this.analytics)) {
        if (typeof window !== 'undefined' && defined(window.ga)) {
            this.analytics = new GoogleAnalytics();
        } else {
            this.analytics = new ConsoleAnalytics();
        }
    }

    /**
     * The name of the app to be built upon Terria. This will appear in error messages to the user.
     * @type {String}
     * @default "TerriaJS App"
     */
    this.appName = defaultValue(options.appName, "TerriaJS App");

    /**
     * The support email for the app to be built upon Terria. This will appear in error messages to the user.
     * @type {String}
     * @default "support@terria.io"
     */
    this.supportEmail = defaultValue(options.supportEmail, "support@terria.io");

    /**
     * An event that is raised when a user-facing error occurs.  This is especially useful for errors that happen asynchronously and so
     * cannot be raised as an exception because no one would be able to catch it.  Subscribers are passed the {@link TerriaError}
     * that occurred as the only function parameter.
     * @type {CesiumEvent}
     */
    this.error = new CesiumEvent();

    /**
     * Gets or sets the map mode.
     * @type {ViewerMode}
     */
    this.viewerMode = ViewerMode.CesiumTerrain;

    /**
     * Gets or sets the current base map.
     * @type {ImageryLayerCatalogItem}
     */
    this.baseMap = undefined;

    /**
     * Gets or sets the name of the base map to use.
     * @type {String}
     */
    this.baseMapName = undefined;

    /**
     * Gets or sets the event that is raised just before switching between Cesium and Leaflet.
     * @type {Event}
     */
    this.beforeViewerChanged = new CesiumEvent();

    /**
     * Gets or sets the event that is raised just after switching between Cesium and Leaflet.
     * @type {Event}
     */
    this.afterViewerChanged = new CesiumEvent();

    /**
     * Gets or sets the collection of Cesium-style data sources that are currently active on the map.
     * @type {DataSourceCollection}
     */
    this.dataSources = new DataSourceCollection();

    /**
     * Gets or sets the clock that controls how time-varying data items are displayed.
     * @type {Clock}
     */
    this.clock = new Clock({
        shouldAnimate: false
    });

    this.timeSeriesStack = new TimeSeriesStack(this.clock);

    // See the intialView property below.
    this._initialView = undefined;

    /**
     * Gets or sets the camera's home view.  The home view is the one that the application
     * returns to when the user clicks the "Reset View" button in the Navigation widget.  It is also used
     * as the {@link Terria#initialView} if one is not specified.
     * @type {CameraView}
     */
    this.homeView = new CameraView(Rectangle.MAX_VALUE);

    /**
     * Gets or sets a value indicating whether the application should automatically zoom to the new view when
     * the {@link Terria#initialView} (or {@link Terria#homeView} if no initial view is specified).
     * @type {Boolean}
     * @default true
     */
    this.zoomWhenInitialViewChanges = true;

    /**
     * Gets or sets the {@link corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
     * @type {corsProxy}
     */
    this.corsProxy = corsProxy;

    /**
     * Gets or sets properties related to the Cesium globe.  If the application is in 2D mode, this property will be
     * undefined and {@link Terria#leaflet} will be set.
     * @type {Cesium}
     */
    this.cesium = undefined;

    /**
     * Gets or sets properties related to the Leaflet map.  If the application is in 3D mode, this property will be
     * undefined and {@link Terria#cesium} will be set.
     * @type {Leaflet}
     */
    this.leaflet = undefined;

    /**
     * Gets or sets a reference to either {@link Terria#cesium} or {@link Terria#leaflet},
     * whichever is currently in use.
     * @type {Cesium|Leaflet}
     */
    this.currentViewer = new NoViewer();

    /**
     * Gets or sets the collection of user properties.  User properties
     * can be set by specifying them in the hash portion of the URL.  For example, if the application URL is
     * `http://localhost:3001/#foo=bar&someproperty=true`, this object will contain a property named 'foo' with the
     * value 'bar' and a property named 'someproperty' with the value 'true'. Currently recognised URL parameters include
     * 'map=[2D,3D]' (choose the Leaflet or Cesium view) and `mode=preview` (suppress warnings, when used as an embedded
     * previewer).
     * @type {Object}
     */
    this.userProperties = {};

    /**
     * Gets or sets the list of sources from which the catalog was populated.  A source may be a string, in which case it
     * is expected to be a URL of an init file (like init_nm.json), or it can be a JSON-style object literal which is
     * the init content itself.
     * @type {Array}
     */
    this.initSources = [];

    /**
     * Gets or sets the features that are currently picked.
     * @type {PickedFeatures}
     */
    this.pickedFeatures = undefined;

    /**
     * Gets or sets the catalog of geospatial data.
     * @type {Catalog}
     */
    this.catalog = new Catalog(this);

    /**
     * Gets or sets the add-on services known to the application.
     * @type {Services}
     */
    this.services = new Services(this);

    /**
     * Gets or sets the collection of geospatial data that is currently enabled.
     * @type {NowViewing}
     */
    this.nowViewing = new NowViewing(this);

    /**
     * Gets or sets the currently-selected feature, or undefined if there is no selected feature.  The selected
     * feature is highlighted by drawing a targetting cursor around it.
     * @type {Entity}
     */
    this.selectedFeature = undefined;

    /**
     * Gets or sets the configuration parameters set at startup.
     * Contains:
     * * regionMappingDefinitionsUrl: URL of JSON file containing region mapping definitions
     * * conversionServiceBaseUrl: URL of OGR2OGR conversion service
     * * proj4ServiceBaseUrl: URL of proj4def lookup service
     * * corsProxyBaseUrl: URL of CORS proxy
     * @type {Object}
     */
    this.configParameters = defaultConfigParameters;

    if (defined(options.regionMappingDefinitionsUrl)) {
        deprecationWarning('regionMappingDefinitionsUrl', 'terria.regionMappingDefinitionsUrl is deprecated. Set parameters: { regionMappingDefinitionsUrl: ...} in config.json, or accept the default (\'data/regionMapping.json\').');
        this.configParameters.regionMappingDefinitionsUrl = options.regionMappingDefinitionsUrl;
    }

    /**
     * Gets or sets the urlShorter to be used with terria.  This is currently set in the start method
     * to allow the urlShortener object to properly initialize.  See the GoogleUrlShortener for an
     * example urlShortener.
     * @type {Object}
     */
    this.urlShortener = undefined;

    /**
     * Event that tracks changes to the progress in loading new tiles from either Cesium or Leaflet - events will be
     * raised with the number of tiles that still need to load.
     *
     * @type {CesiumEvent}
     */
    this.tileLoadProgressEvent = new CesiumEvent();

    this.disclaimerListener = function(catalogMember, callback) {
        window.alert(catalogMember.initialMessage.content);
        callback();
    };

    knockout.track(this, ['viewerMode', 'baseMap', 'baseMapName', '_initialView', 'homeView', 'pickedFeatures', 'selectedFeature', 'configParameters']);

    // IE versions prior to 10 don't support CORS, so always use the proxy.
    corsProxy.alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);

    /**
     * Gets or sets the camera's initial view.  This is the view that the application has at startup.  If this property
     * is not explicitly specified, the {@link Terria#homeView} is used.
     * @type {CameraView}
     */
    knockout.defineProperty(this, 'initialView', {
        get: function() {
            if (this._initialView) {
                return this._initialView;
            } else {
                return this.homeView;
            }
        },
        set: function(value) {
            this._initialView = value;
        }
    });

    knockout.getObservable(this, 'initialView').subscribe(function() {
        if (this.zoomWhenInitialViewChanges && defined(this.currentViewer)) {
            this.currentViewer.zoomTo(this.initialView, 2.0);
        }
    }, this);
};

/**
 * Starts up Terria.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} [options.applicationUrl] The URL of the application.  Typically this is obtained from window.location.  This URL, if
 *                                          supplied, is parsed for startup parameters.
 * @param {String} [options.configUrl='config.json'] The URL of the file containing configuration information, such as the list of domains to proxy.
 * @param {UrlShortener} [options.urlShortener] The URL shortener to use to expand short URLs.  If this property is undefined, short URLs will not be expanded.
 */
Terria.prototype.start = function(options) {
    function slashify(url) {
        return (url && url[url.length-1] !== '/') ? url + '/' : url;
    }
    this.catalog.isLoading = true;

    var applicationUrl = defaultValue(options.applicationUrl, '');
    this.urlShortener = options.urlShortener;

    var that = this;
    return loadJson(options.configUrl).then(function(config) {
        if (defined(config.parameters)) {
            // allow config file to provide TerriaJS-Server URLs to facilitate purely static deployments relying on external services
            that.configParameters = combine(config.parameters, that.configParameters);
        }
        var cp = that.configParameters;
        cp.conversionServiceBaseUrl = slashify(cp.conversionServiceBaseUrl);
        cp.proj4ServiceBaseUrl = slashify(cp.proj4ServiceBaseUrl);
        cp.corsProxyBaseUrl = slashify(cp.corsProxyBaseUrl);

        corsProxy.proxyDomains.push.apply(corsProxy.proxyDomains, config.proxyDomains);
        corsProxy.baseProxyUrl = that.configParameters.corsProxyBaseUrl;

        that.appName = defaultValue(cp.appName, defaultValue(options.appName, that.appName));
        that.supportEmail = defaultValue(cp.supportEmail, defaultValue(options.supportEmail, that.supportEmail));

        that.analytics.start(that.configParameters);
        that.analytics.logEvent('launch', 'url', defined(applicationUrl.href) ? applicationUrl.href : 'empty');

        var initializationUrls = config.initializationUrls;

        if (defined(initializationUrls)) {
            for (var i = 0; i < initializationUrls.length; i++) {
                that.initSources.push(generateInitializationUrl(initializationUrls[i]));
            }
        }

        return that.updateApplicationUrl(applicationUrl, that.urlShortener).then(function() {
            if (options.defaultTo2D && !defined(that.userProperties.map)) {
                that.viewerMode = ViewerMode.Leaflet;
            }
            that.catalog.isLoading = false;
        });
    });
};

/**
 * Updates the state of the application based on the hash portion of a URL.
 * @param {String} newUrl The new URL of the application.
 * @return {Promise} A promise that resolves when any new init sources specified in the URL have been loaded.
 */
Terria.prototype.updateApplicationUrl = function(newUrl) {
    var uri = new URI(newUrl);
    var hash = uri.fragment();
    var hashProperties = queryToObject(hash);

    var initSources = this.initSources.slice();
    var promise = interpretHash(this, hashProperties, this.userProperties, this.initSources, initSources);

    var that = this;
    return when(promise).then(function() {
        if (that.userProperties.map === '2d') {
            that.viewerMode = ViewerMode.Leaflet;
        } else if (that.userProperties.map === '3d') {
            that.viewerMode = ViewerMode.CesiumTerrain;
        }

        return loadInitSources(that, initSources);
    });
};

Terria.prototype.updateFromStartData = function(startData) {
    var initSources = this.initSources.slice();
    interpretStartData(startData, this.initSources, initSources);
    return loadInitSources(this, initSources);
};

/**
 * Gets the value of a user property.  If the property doesn't exist, it is created as an observable property with the
 * value undefined.  This way, if it becomes defined in the future, anyone depending on the value will be notified.
 * @param {String} propertyName The name of the user property for which to get the value.
 * @return {Object} The value of the property, or undefined if the property does not exist.
 */
Terria.prototype.getUserProperty = function(propertyName) {
    if (!knockout.getObservable(this.userProperties, propertyName)) {
        this.userProperties[propertyName] = undefined;
        knockout.track(this.userProperties, [propertyName]);
    }
    return this.userProperties[propertyName];
};

Terria.prototype.addInitSource = function(initSource) {
    var promise = when();

    // Extract the list of CORS-ready domains.
    if (defined(initSource.corsDomains)) {
        corsProxy.corsDomains.push.apply(corsProxy.corsDomains, initSource.corsDomains);
    }

    // The last init source to specify an initial/home camera view wins.
    if (defined(initSource.homeCamera)) {
        this.homeView = CameraView.fromJson(initSource.homeCamera);
    }

    if (defined(initSource.initialCamera)) {
        this.initialView = CameraView.fromJson(initSource.initialCamera);
    }

    if (defined(initSource.baseMapName)) {
        this.baseMapName = initSource.baseMapName;
    }

    if (defined(initSource.viewerMode) && !defined(this.userProperties.map)) {
        if (initSource.viewerMode === '2d') {
            this.viewerMode = ViewerMode.Leaflet;
        } else if (initSource.viewerMode === '3d') {
            this.viewerMode = ViewerMode.CesiumTerrain;
        }
    }

    // Populate the list of services.
    if (defined(initSource.services)) {
        this.services.services.push.apply(this.services, initSource.services);
    }

    // Populate the catalog
    if (defined(initSource.catalog)) {
        var isUserSupplied = !initSource.isFromExternalFile;

        promise = promise.then(this.catalog.updateFromJson.bind(this.catalog, initSource.catalog, {
            isUserSupplied: isUserSupplied
        }));
    }

    if (defined(initSource.sharedCatalogMembers)) {
        promise = promise.then(this.catalog.updateByShareKeys.bind(this.catalog, initSource.sharedCatalogMembers));
    }

    return promise;
};

Terria.prototype.getLocalProperty = function(key) {
    try {
        if (!defined(window.localStorage)) {
            return undefined;
        }
    } catch (e) {
        // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
        return undefined;
    }
    var v = window.localStorage.getItem(this.appName + '.' + key);
    if (v === 'true') {
        return true;
    } else if (v === 'false') {
        return false;
    }
    return v;
};

Terria.prototype.setLocalProperty = function(key, value) {
    try {
        if (!defined(window.localStorage)) {
            return undefined;
        }
    } catch (e) {
        return undefined;
    }
    window.localStorage.setItem(this.appName + '.' + key, value);
    return true;
};

var latestStartVersion = '0.0.05';

function interpretHash(terria, hashProperties, userProperties, persistentInitSources, temporaryInitSources) {
    var promise;
    if (defined(terria.urlShortener) && defined(hashProperties.share)) {
        promise = terria.urlShortener.expand(hashProperties.share);
    }

    return when(promise, function(longUrl) {
        if (defined(longUrl)) {
            var uri = new URI(longUrl);
            var hash = uri.fragment();
            hashProperties = combine(hashProperties, queryToObject(hash));
        }

        for (var property in hashProperties) {
            if (hashProperties.hasOwnProperty(property)) {
                var propertyValue = hashProperties[property];

                if (property === 'clean') {
                    persistentInitSources.length = 0;
                    temporaryInitSources.length = 0;
                } else if (property === 'start') {
                    var startData = JSON.parse(propertyValue);
                    interpretStartData(startData, persistentInitSources, temporaryInitSources);
                } else if (defined(propertyValue) && propertyValue.length > 0) {
                    userProperties[property] = propertyValue;
                    knockout.track(userProperties, [property]);
                } else {
                    var initSourceFile = generateInitializationUrl(property);
                    persistentInitSources.push(initSourceFile);
                    temporaryInitSources.push(initSourceFile);
                }
            }
        }
    });
}

function interpretStartData(startData, persistentInitSources, temporaryInitSources) {
    if (defined(startData.version) && startData.version !== latestStartVersion) {
        adjustForBackwardCompatibility(startData);
    }

    // Include any initSources specified in the URL.
    if (defined(startData.initSources)) {
        for (var i = 0; i < startData.initSources.length; ++i) {
            var initSource = startData.initSources[i];
            if (temporaryInitSources.indexOf(initSource) < 0) {
                temporaryInitSources.push(initSource);

                // Only add external files to the application's list of init sources.
                if (typeof initSource === 'string' && persistentInitSources.indexOf(initSource) < 0) {
                    persistentInitSources.push(initSource);
                }
            }
        }
    }
}

function generateInitializationUrl(url) {
    if (url.toLowerCase().substring(url.length-5) !== '.json') {
        return 'init/' + url + '.json';
    }
    return url;
}

function loadInitSources(terria, initSources) {
    return initSources.reduce(function (promiseSoFar, initSource) {
        return promiseSoFar
            .then(loadInitSource.bind(undefined, terria, initSource))
            .then(function (initSource) {
                if (defined(initSource)) {
                    return terria.addInitSource(initSource);
                }
            });
    }, when());
}

function loadInitSource(terria, source) {
    if (typeof source === 'string') {
        if (corsProxy.shouldUseProxy(source)) {
            source = corsProxy.getURL(source);
        }
        return loadJson(source).then(function(initSource) {
            initSource.isFromExternalFile = true;
            return initSource;
        }).otherwise(function() {
            terria.error.raiseEvent({
                title: 'Error loading initialization source',
                message: 'An error occurred while loading initialization information from ' + source + '.  This may indicate that you followed an invalid link or that there is a problem with your Internet connection.'
            });
            return undefined;
        });
    } else {
        return source;
    }
}

function adjustForBackwardCompatibility(startData) {
    if (startData.version === '0.0.03') {
        // In this version, there was just a single 'camera' property instead of a 'homeCamera' and 'initialCamera'.
        // Treat the one property as the initialCamera.
        for (var i = 0; i < startData.initSources.length; ++i) {
            if (defined(startData.initSources[i].camera)) {
                startData.initSources[i].initialCamera = startData.initSources[i].camera;
                startData.initSources[i].camera = undefined;
            }
        }
    }
}

module.exports = Terria;
