'use strict';
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

var LeafletViewModel = function(application, map) {
    /**
     * Gets or sets the Leaflet {@link Map} instance.
     * @type {Map}
     */
    this.map = map;
};

/**
 * Zooms to a specified extent.
 *
 * @param {Rectangle} extent The extent to which to zoom.
 */
LeafletViewModel.prototype.zoomTo = function(extent) {
    this.map.fitBounds(rectangleToLatLngBounds(extent));
};

module.exports = LeafletViewModel;
