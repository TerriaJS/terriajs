"use strict";

/*global require, URI*/
var CesiumEvent = require('../../third_party/cesium/Source/Core/Event');
var Clock = require('../../third_party/cesium/Source/Core/Clock');
var DataSourceCollection = require('../../third_party/cesium/Source/DataSources/DataSourceCollection');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var FeatureDetection = require('../../third_party/cesium/Source/Core/FeatureDetection');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var queryToObject = require('../../third_party/cesium/Source/Core/queryToObject');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var CameraView = require('./CameraView');
var Catalog = require('./Catalog');
var corsProxy = require('../Core/corsProxy');
var NowViewing = require('./NowViewing');
var Services = require('./Services');
var ViewerMode = require('./ViewerMode');
var ModelError = require('./ModelError');

/**
 * The overall model for National Map.
 * @alias Application
 * @constructor
 */
var Application = function() {
    /**
     * An event that is raised when a user-facing error occurs.  This is especially useful for errors that happen asynchronously and so
     * cannot be raised as an exception because no one would be able to catch it.  Subscribers are passed the {@link ModelError}
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
    this.clock = new Clock();

    // See the intialView property below.
    this._initialView = undefined;

    /**
     * Gets or sets the camera's home view.  The home view is the one that the application
     * returns to when the user clicks the "Reset View" button in the Navigation widget.  It is also used
     * as the {@link Application#initialView} if one is not specified.
     * @type {CameraView}
     */
    this.homeView = new CameraView(Rectangle.MAX_VALUE);

    /**
     * Gets or sets a value indicating whether the application should automatically zoom to the new view when
     * the {@link Application#initialView} (or {@link Application#homeView} if no initial view is specified).
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
     * undefined and {@link Application#leaflet} will be set.
     * @type {Cesium}
     */
    this.cesium = undefined;

    /**
     * Gets or sets properties related to the Leaflet map.  If the application is in 3D mode, this property will be
     * undefined and {@link Application#cesium} will be set.
     * @type {Leaflet}
     */
    this.leaflet = undefined;

    /**
     * Gets or sets a reference to either {@link Application#cesium} or {@link Application#leaflet},
     * whichever is currently in use.
     * @type {Cesium|Leaflet}
     */
    this.currentViewer = undefined;

    /**
     * Gets or sets the collection of user properties.  User properties
     * can be set by specifying them in the hash portion of the URL.  For example, if the application URL is
     * `http://localhost:3001/#foo=bar&someproperty=true`, this object will contain a property named 'foo' with the
     * value 'bar' and a property named 'someproperty' with the value 'true'.
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

    knockout.track(this, ['viewerMode', 'baseMap', '_initialView', 'homeView']);

    // IE versions prior to 10 don't support CORS, so always use the proxy.
    corsProxy.alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);

    /**
     * Gets or sets the camera's initial view.  This is the view that the application has at startup.  If this property
     * is not explicitly specified, the {@link Application#homeView} is used.
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
 * Starts the application.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} [options.applicationUrl] The URL of the application.  Typically this is obtained from window.location.  This URL, if
 *                                          supplied, is parsed for startup parameters.
 * @param {String} [options.configUrl='config.json'] The URL of the file containing configuration information, such as the list of domains to proxy.
 * @param {Boolean} [options.useApplicationUrlHashAsInitSource=true] true to parse the applicationUrl as an init source.  The hash may be of the form
 *                                                                   'start=???', where ??? is a JSON-encoded initialization object, or it may be
 *                                                                   a simple string.  If it's a simple string, a file named 'init_' + hash + '.json'
 *                                                                   will be loaded as the init source.  For example, #vic will load init_vic.json.
 */
Application.prototype.start = function(options) {
    var applicationUrl = defaultValue(options.applicationUrl, '');

    var that = this;
    return loadJson(options.configUrl).then(function(config) {
        corsProxy.proxyDomains.push.apply(corsProxy.proxyDomains, config.proxyDomains);

        var initializationUrls = config.initializationUrls;

        if (defined(initializationUrls)) {
            for (var i = 0; i < initializationUrls.length; i++) {
                that.initSources.push(generateInitializationUrl(initializationUrls[i]));
            }
        }

        return that.updateApplicationUrl(applicationUrl);
    });
};

/**
 * Updates the state of the application based on the hash portion of a URL.
 * @param {String} newUrl The new URL of the application.
 * @return {Promise} A promise that resolves when any new init sources specified in the URL have been loaded.
 */
Application.prototype.updateApplicationUrl = function(newUrl) {
    var uri = new URI(newUrl);
    var hash = uri.fragment();
    var hashProperties = queryToObject(hash);

    var initSources = this.initSources.slice();
    interpretHash(hashProperties, this.userProperties, this.initSources, initSources);

    return loadInitSources(this, initSources);
};

/**
 * Gets the value of a user property.  If the property doesn't exist, it is created as an observable property with the 
 * value undefined.  This way, if it becomes defined in the future, anyone depending on the value will be notified.
 * @param {String} propertyName The name of the user property for which to get the value.
 * @return {Object} The value of the property, or undefined if the property does not exist.
 */
Application.prototype.getUserProperty = function(propertyName) {
    if (!knockout.getObservable(this.userProperties, propertyName)) {
        this.userProperties[propertyName] = undefined;
        knockout.track(this.userProperties, [propertyName]);
    }
    return this.userProperties[propertyName];
};

Application.prototype.addInitSource = function(initSource) {
    // Extract the list of CORS-ready domains.
    if (defined(initSource.corsDomains)) {
        corsProxy.corsDomains.push.apply(corsProxy.corsDomains, initSource.corsDomains);
    }

    // The last init source to specify an initial/home camera view wins.
    if (defined(initSource.homeCamera)) {
        this.homeView = new CameraView(
            Rectangle.fromDegrees(initSource.homeCamera.west, initSource.homeCamera.south, initSource.homeCamera.east, initSource.homeCamera.north),
            initSource.homeCamera.position,
            initSource.homeCamera.direction,
            initSource.homeCamera.up);
    }

    if (defined(initSource.initialCamera)) {
        this.initialView = new CameraView(
            Rectangle.fromDegrees(initSource.initialCamera.west, initSource.initialCamera.south, initSource.initialCamera.east, initSource.initialCamera.north),
            initSource.initialCamera.position,
            initSource.initialCamera.direction,
            initSource.initialCamera.up);
    }

    // Populate the list of services.
    if (defined(initSource.services)) {
        this.services.services.push.apply(this.services, initSource.services);
    }

    // Populate the catalog
    if (defined(initSource.catalog)) {
        var isUserSupplied;
        if (initSource.isFromExternalFile) {
            isUserSupplied = false;
        } else if (initSource.catalogOnlyUpdatesExistingItems) {
            isUserSupplied = undefined;
        } else {
            isUserSupplied = true;
        }

        return this.catalog.updateFromJson(initSource.catalog, {
            onlyUpdateExistingItems: initSource.catalogOnlyUpdatesExistingItems,
            isUserSupplied: isUserSupplied
        });
    } else {
        return when();
    }
};

var latestStartVersion = '0.0.04';

function interpretHash(hashProperties, userProperties, persistentInitSources, temporaryInitSources) {
    for (var property in hashProperties) {
        if (hashProperties.hasOwnProperty(property)) {
            var propertyValue = hashProperties[property];

            if (property === 'clean') {
                persistentInitSources.length = 0;
                temporaryInitSources.length = 0;
            }
            else if (property === 'start') {
                var startData = JSON.parse(propertyValue);

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
}

function generateInitializationUrl(url) {
    if (url.toLowerCase().substring(url.length-5) !== '.json') {
        return 'init/' + url + '.json';
    }
    return url;
}

function loadInitSources(application, initSources) {
    return when.all(initSources.map(loadInitSource), function(initSources) {
        var promises = [];

        for (var i = 0; i < initSources.length; ++i) {
            var initSource = initSources[i];
            if (!defined(initSource)) {
                continue;
            }
            application.addInitSource(initSource);
        }

        return when.all(promises);
    });
}

function loadInitSource(source) {
    if (typeof source === 'string') {
        return loadJson(source).then(function(initSource) {
            initSource.isFromExternalFile = true;
            return initSource;
        }).otherwise(function() {
            throw new ModelError({
                title: 'Error loading initialization source',
                message: 'An error occurred while loading initialization information from ' + source + '.  This may indicate that you followed an invalid link or that there is a problem with your Internet connection.'
            });
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

module.exports = Application;
