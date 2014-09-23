"use strict";

var GeoDataCatalogContext = function() {
    /**
     * Gets or sets the Cesium Scene.  If the application is in 2D mode, this property will be undefined and
     * {@link GeoDataCatalogContext#leafletMap} will be set.
     *
     * @type {Scene}
     */
    this.cesiumScene = undefined;

    /**
     * Gets or sets the Leaflet Map.  If the application is in 3D mode, this property will be undefined and
     * {@link GeoDataCatalogContext#cesiumScene} will be set.
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
};

module.exports = GeoDataCatalogContext;
