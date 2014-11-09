"use strict";

var CesiumEvent = require('../../third_party/cesium/Source/Core/Event');
var Clock = require('../../third_party/cesium/Source/Core/Clock');
var DataSourceCollection = require('../../third_party/cesium/Source/DataSources/DataSourceCollection');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var CatalogViewModel = require('./CatalogViewModel');
var corsProxy = require('../Core/corsProxy');
var NowViewingViewModel = require('./NowViewingViewModel');
var ServicesViewModel = require('./ServicesViewModel');
var ViewerMode = require('./ViewerMode');

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

module.exports = ApplicationViewModel;
