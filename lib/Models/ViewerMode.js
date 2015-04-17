'use strict';

/**
 * Identifies the map viewer mode to use.
 * @alias ViewerMode
 */
var ViewerMode = {
    /**
     * Cesium is used for a 3D view with terrain.
     * @type {Number}
     * @constant
     */
    CesiumTerrain : 0,

    /**
     * Cesium is used for a 3D view, but the globe surface is a smooth ellipsoid.
     * @type {Number}
     * @constant
     */
    CesiumEllipsoid : 1,

    /**
     * Leaflet is used for a 2D map.
     * @type {Number}
     */
    Leaflet : 2
};

module.exports = ViewerMode;
