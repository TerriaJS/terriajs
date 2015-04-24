'use strict';

/*global require*/
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');

var LeafletScene = function(map) {
    /**
     * Gets or sets the Leaflet map.
     * @type {L.map}
     */
    this.map = map;

    /**
     * Gets or sets an event that is raised when a feature is clicked on the Leaflet map.
     * @type {CesiumEvent}
     */
    this.featureClicked = new CesiumEvent();
};

module.exports = LeafletScene;