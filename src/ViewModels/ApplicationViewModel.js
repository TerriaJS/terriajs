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
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var CatalogViewModel = require('./CatalogViewModel');
var corsProxy = require('../Core/corsProxy');
var NowViewingViewModel = require('./NowViewingViewModel');
var ServicesViewModel = require('./ServicesViewModel');
var ViewerMode = require('./ViewerMode');
var ViewModelError = require('./ViewModelError');

/**
 * The overall view-model for National Map.
 * @alias ApplicationViewModel
 * @constructor
 */
var ApplicationViewModel = function() {
    /**
     * An event that is raised when a user-facing error occurs.  This is especially useful for errors that happen asynchronously and so
     * cannot be raised as an exception because no one would be able to catch it.  Subscribers are passed the {@link ViewModelError}
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

    /**
     * Gets or sets the initial bounding box of the camera's view.
     * @type {Rectangle}
     */
    this.initialBoundingBox = Rectangle.MAX_VALUE;

    /**
     * Gets or sets the {@link corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
     * @type {corsProxy}
     */
    this.corsProxy = corsProxy;

    /**
     * Gets or sets properties related to the Cesium globe.  If the application is in 2D mode, this property will be
     * undefined and {@link ApplicationViewModel#leaflet} will be set.
     * @type {CesiumViewModel}
     */
    this.cesium = undefined;

    /**
     * Gets or sets properties related to the Leaflet map.  If the application is in 3D mode, this property will be
     * undefined and {@link ApplicationViewModel#cesium} will be set.
     * @type {LeafletViewModel}
     */
    this.leaflet = undefined;

    /**
     * Gets or sets the list of sources from which the catalog was populated.  A source may be a string, in which case it
     * is expected to be a URL of an init file (like init_nm.json), or it can be a JSON-style object literal which is
     * the init content itself.
     * @type {Array}
     */
    this.initSources = [];

    /**
     * Gets or sets the catalog of geospatial data.
     * @type {CatalogViewModel}
     */
    this.catalog = new CatalogViewModel(this);

    /**
     * Gets or sets the add-on services known to the application.
     * @type {ServicesViewModel}
     */
    this.services = new ServicesViewModel(this);

    /**
     * Gets or sets the collection of geospatial data that is currently enabled.
     * @type {NowViewingViewModel}
     */
    this.nowViewing = new NowViewingViewModel(this);

    knockout.track(this, ['viewerMode']);
};

/**
 * Starts the application.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} [options.applicationUrl] The URL of the application.  Typically this is obtained from window.location.  This URL, if
 *                                          supplied, is parsed for startup parameters.
 * @param {String} [options.configUrl='config.json'] The URL of the file containing configuration information, such as the list of domains to proxy.
 * @param {String} [options.initializationUrl] The URL of the main file containing initialization information, such as the list of
 *                                             catalog items.
 * @param {Boolean} [options.useApplicationUrlHashAsInitSource=true] true to parse the applicationUrl as an init source.  The hash may be of the form
 *                                                                   'start=???', where ??? is a JSON-encoded initialization object, or it may be
 *                                                                   a simple string.  If it's a simple string, a file named 'init_' + hash + '.json'
 *                                                                   will be loaded as the init source.  For example, #vic will load init_vic.json.
 */
ApplicationViewModel.prototype.start = function(options) {
    var applicationUrl = defaultValue(options.applicationUrl, '');
    var configUrl = defaultValue(options.configUrl, 'config.json');

    var uri = new URI(applicationUrl);
    var urlParameters = uri.search(true);
    var hash = uri.fragment();

    var that = this;
    return loadJson(options.configUrl).then(function(config) {
        if (defined(options.initializationUrl)) {
            that.initSources.push(options.initializationUrl);
        }

        // If the URL includes a hash, try loading the corresponding init file.
        var startData = {};
        if (defaultValue(options.useApplicationUrlHashAsInitSource, true)) {
            if (defined(hash) && hash.length > 0) {
                if (hash.indexOf('start=') === 0) {
                    startData = JSON.parse(decodeURIComponent(hash.substring(6)));
                } else if (hash.toLowerCase() !== 'populate-cache') {
                    that.initSources.push('init_' + hash + ".json");
                }
            }
        }

        var initSources = that.initSources.slice();

        // Include any initSources specified in the URL.
        if (defined(startData.initSources)) {
            for (var i = 0; i < startData.initSources.length; ++i) {
                var initSource = startData.initSources[i];
                if (initSources.indexOf(initSource) < 0) {
                    initSources.push(initSource);

                    // Only add external files to the application's list of init sources.
                    if (typeof initSource === 'string') {
                        that.initSources.push(initSource);
                    }
                }
            }
        }

        // Load all of the init sources.
        return when.all(initSources.map(loadInitSource), function(initSources) {
            var corsDomains = [];
            var i;
            var initSource;

            for (i = 0; i < initSources.length; ++i) {
                initSource = initSources[i];
                if (!defined(initSource)) {
                    continue;
                }

                // Extract the list of CORS-ready domains from the init sources.
                if (defined(initSource.corsDomains)) {
                    corsDomains.push.apply(corsDomains, initSource.corsDomains);
                }

                // The last init source to specify a camera position wins.
                if (defined(initSource.camera)) {
                    that.initialBoundingBox = initSource.camera;
                }
            }

            // Configure the proxy.
            // IE versions prior to 10 don't support CORS, so always use the proxy.
            var alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);
            corsProxy.setProxyList(config.proxyDomains, corsDomains, alwaysUseProxy);

            var promises = [];

            // Make another pass over the init sources to update the catalog and load services.
            for (i = 0; i < initSources.length; ++i) {
                initSource = initSources[i];
                if (!defined(initSource)) {
                    continue;
                }

                if (defined(initSource.catalog)) {
                    var isUserSupplied;
                    if (initSource.isFromExternalFile) {
                        isUserSupplied = false;
                    } else if (initSource.catalogOnlyUpdatesExistingItems) {
                        isUserSupplied = undefined;
                    } else {
                        isUserSupplied = true;
                    }

                    promises.push(that.catalog.updateFromJson(initSource.catalog, {
                        onlyUpdateExistingItems: initSource.catalogOnlyUpdatesExistingItems,
                        isUserSupplied: isUserSupplied
                    }));
                }

                if (defined(initSource.services)) {
                    that.services.services.push.apply(that.services, initSource.services);
                }
            }

            return when.all(promises);
        });
    });
};

function loadInitSource(source) {
    if (typeof source === 'string') {
        return loadJson(source).then(function(initSource) {
            initSource.isFromExternalFile = true;
            return initSource;
        }).otherwise(function() {
            throw new ViewModelError({
                title: 'Error loading initialization source',
                message: 'An error occurred while loading initialization information from ' + source + '.  This may indicate that you followed an invalid link or that there is a problem with your Internet connection.'
            });
        });
    } else {
        return source;
    }
}

module.exports = ApplicationViewModel;
