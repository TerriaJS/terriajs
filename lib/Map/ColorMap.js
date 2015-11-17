'use strict';

/*global require*/
//var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
//var defined = require('terriajs-cesium/Source/Core/defined');
var inherit = require('../Core/inherit');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * A color map is a one dimensional scale of colours used to visually represent a numerical value. It is
 * implemented as an Array of { color, offset } objects, where the first object has an offset of 0, the
 * last has an offset of 1, and the others are ordered in between.
 * It can be instantiated directly from an array, or through the factory method ColorMap.fromString().
 * @param {Object[]} arr, an array of { 
 *     color, // CSS color name
 *     offset // number between 0 and 1
 *     }
 */

var ColorMap = function(arr) {
    if (arr instanceof Array) {
        arr.forEach(function(e) {
            this.push(e);
        }, this);
    }
};

inherit(Array, ColorMap);

// Without this, the array is expressed as an object in JSON.
ColorMap.prototype.toJSON = function() {
    return this.slice();
};

/** Creates an evenly spaced ColorMap object from an array of CSS color strings.
 */
function colorMapFromArray (colors) {
    return new ColorMap(
        colors.map(function(el, index) {
            var obj = {};
            obj['color'] = el;
            obj['offset'] = index/(colors.length - 1);
            return obj;
        }).filter(function(o) { return o.color !== ''; }));
}

/** 
 * Access the Color Brewer colour definitions.
 * @return {Promise} The contents of the ColorBrewer JSON file
 */
ColorMap.colorBrewerFile = function() {
    if (ColorMap.colorBrewerJSON) {
        return when(ColorMap.colorBrewerJSON);
    } else {
        // store the promise so we don't send off lots of requests for the same file.
        ColorMap.colorBrewerJSON = loadJson('build/TerriaJS/data/colorbrewer.json').then(function(j) {
            ColorMap.colorBrewerJSON = j;
            return j;
        });
        return ColorMap.colorBrewerJSON;
    }

};

/**
  * Simplified way to construct a colorMap object, using hyphenated CSS color names. For example, "red-white-hsl(240,50%,40%)". 
  */
ColorMap.fromString = function(s) {
    if (!s) {
        return undefined;
    }
    var matches = s.match(/^colorbrewer: *((\d+)-class *)?([^-]+)/i);
    if (matches) {
        var name = matches[3], classes = (matches[2] ? matches[2] : 7); // ## fix the 7 later
        return ColorMap.colorBrewerFile().then(function(j) {
            if (j && j[name] && j[name][classes]) {
                return colorMapFromArray(j[name][classes]);
            } else {
                return undefined;
            }
        });
    }
    // a secret feature of this is that "red-white---blue" is a legal way to specify an offset color map.
    return when(colorMapFromArray(s.split('-')));
};

module.exports = ColorMap;
