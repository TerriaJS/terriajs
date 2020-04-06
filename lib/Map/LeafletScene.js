"use strict";

/*global require*/
var CesiumEvent = require("terriajs-cesium/Source/Core/Event").default;

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

  /**
   * Gets or sets an event that is raised when a mousedown event occurs on the Leaflet map.
   * @type {CesiumEvent}
   */
  this.featureMousedown = new CesiumEvent();
};

module.exports = LeafletScene;
