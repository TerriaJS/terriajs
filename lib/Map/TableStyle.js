'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');


var TableStyle = function(props) {
    props = props || {};

    this.regionVariable = props.regionVariable;

    this.dataVariable = props.dataVariable;
    this.minDisplayValue = props.minDisplayValue;
    this.maxDisplayValue = props.maxDisplayValue;
    this.featureInfoFields = props.featureInfoFields;
    /* How many horizontal ticks to draw on the generated color ramp legend, not counting the top or bottom. */
    this.legendTicks = props.legendTicks;

    /* The identifier of a region type, as used by RegionProviderList */
    this.regionType = props.regionType;

    /* An array of { 
      color, // CSS color name
      offset // number between 0 and 1
      } */
    this.colorMap = props.colorMap;

    /* A compact way of specifying color maps, like "red-white-hsl(240,50%,50%)" */
    this.colorMapString = props.colorMapString;

    // maybe
    this.colorMapName = props.colorMapName;

};

TableStyle.prototype.toJSON = function() {
    var json = {};
    Object.keys(this).forEach(function(k) {
        if (defined(this[k])) {
            json[k] = this[k];
        }
    }, this);
    return json;
};

/*TableStyle.prototype.fromJSON = function(json) {
    Object.keys(json).forEach(function(k) {
        this[k] = json[k];
    }, this);
    return this;
};*/

module.exports = TableStyle;
