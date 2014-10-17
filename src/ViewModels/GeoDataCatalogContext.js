"use strict";

var CesiumEvent = require('../../third_party/cesium/Source/Core/Event');

/**
 * Represents contextual information related to the catalog, groups, and data sources.
 * @alias GeoDataCatalogContext
 * @constructor
 */
var GeoDataCatalogContext = function() {
    /**
     * Gets or sets the Cesium Scene.  If the application is in 2D mode, this property will be undefined and
     * {@link GeoDataCatalogContext#leafletMap} will be set.
     *
     * @type {Scene}
     */
    this.cesiumScene = undefined;

    /**
     * Gets or sets the Cesium Viewer.  If the application is in 2D mode, this property will be undefined
     * {@link GeoDataCatalogContext#leafletMap} will be set.
     *
     * @type {Viewer}
     */
    this.cesiumViewer = undefined;

    /**
     * Gets or sets the Leaflet Map.  If the application is in 3D mode, this property will be undefined and
     * {@link GeoDataCatalogContext#cesiumScene} and {@link GeoDataCatalogContext#cesiumViewer} will be set.
     *
     * @type {Map}
     */
    this.leafletMap = undefined;

    /**
     * Gets or sets the {@link NowViewingViewModel}.
     *
     * @type {NowViewingViewModel}
     */
    this.nowViewing = undefined;

    /**
     * Gets or sets the {@link corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
     * @type {corsProxy}
     */
    this.corsProxy = undefined;

    /**
     * Gets or sets the event that is raised just before switching between between Cesium and Leaflet.
     * @type {Event}
     */
    this.beforeViewerChanged = new CesiumEvent();

    /**
     * Gets or sets the event that is raised just after switching between between Cesium and Leaflet.
     * @type {Event}
     */
    this.afterViewerChanged = new CesiumEvent();

    /**
     * An event that is raised when a user-facing error occurs with the catalog, groups, or data sources.
     * The following parameters are passed to the event handler:
     *
     * * The object raising the error.
     * * A short title describing the error.
     * * A detailed message describing the error.  This may include HTML tags.
     * @type {CesiumEvent}
     */
    this.error = new CesiumEvent();
};

module.exports = GeoDataCatalogContext;
