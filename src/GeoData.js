/*global require*/
"use strict";

var defaultValue = require('../third_party/cesium/Source/Core/defaultValue');


/**
* This class is container for Geobased data set
*
* @alias GeoData
* @constructor
*
* @param {Object} [description] Object with the following properties:
* @param {String} [description.name] Name of geo data.
* @param {Boolean} [description.show] Display state for data
* @param {String} [description.type] The identifier of the service
* @param {Object} [description.primitive] The map viewer display primitive to use
* @param {Object} [description.extent] Extent filter for feature request
* @param {Url} [description.base_url] The url for the service
* @param {Object} [description.style] Display settings for the data
*/
var GeoData = function(description) {
    this.name = defaultValue(description.name, 'New Item');
    this.show = defaultValue(description.show, true);
    this.type = defaultValue(description.type, 'UNKNOWN');
    this.primitive = defaultValue(description.primitive, undefined);
    this.extent = defaultValue(description.extent, undefined);
    this.url = defaultValue(description.url, undefined);
    this.style = defaultValue(description.style, undefined);
};

module.exports = GeoData;


