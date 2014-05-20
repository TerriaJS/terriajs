

"use strict";

var defaultValue = Cesium.defaultValue;


/**
* @class GeoData is a container for generic geodata
* @name GeoData
*
* @alias GeoData
* @internalConstructor
* @constructor
*/
var GeoData = function(description) {
    this.name = defaultValue(description.name, 'New Item');
    this.show = defaultValue(description.show, true);
    this.type = defaultValue(description.type, 'UNKNOWN');
    this.primitive = defaultValue(description.primitive, undefined);
    this.extent = defaultValue(description.extent, undefined);
    this.url = defaultValue(description.url, undefined);
    this.style = defaultValue(description.style, undefined);
}

module.exports = GeoData;


