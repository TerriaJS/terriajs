'use strict';

/*global require*/
var inherit = require('../Core/inherit');

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
var ColorMap = function(array) {
    if (array instanceof Array) {
        array.forEach(function(e) {
            this.push(e);
        }, this);
    }
};

inherit(Array, ColorMap);

// Without this, the array is expressed as an object in JSON.
ColorMap.prototype.toJSON = function() {
    return this.slice();
};

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
  * Simplified way to construct a colorMap object, using hyphenated CSS color names. For example, "red-white-hsl(240,50%,40%)".
  */
ColorMap.fromString = function(s) {
    if (!s) {
        return undefined;
    }
    // a secret feature of this is that "red-white---blue" is a legal way to specify an offset color map.
    return colorMapFromArray(s.split('-'));
};

module.exports = ColorMap;
