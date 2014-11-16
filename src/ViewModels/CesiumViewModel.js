'use strict';

var CesiumViewModel = function(application, viewer) {
    /**
     * Gets or sets the Cesium {@link Viewer} instance.
     * @type {Viewer}
     */
    this.viewer = viewer;

    /**
     * Gets or sets the Cesium {@link Scene} instance.
     * @type {Scene}
     */
    this.scene = viewer.scene;
};

module.exports = CesiumViewModel;
