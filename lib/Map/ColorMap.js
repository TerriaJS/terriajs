'use strict';

/*global require*/
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

/** Creates an evenly spaced ColorMap object from an array of CSS color strings.
 */
ColorMap.fromArray = function (colors) {
    return new ColorMap(
        colors.map(function(el, index) {
            var obj = {};
            obj['color'] = el;
            obj['offset'] = index/(colors.length - 1);
            return obj;
        }).filter(function(o) { return o.color !== ''; }));
};

/**
 * Access the Color Brewer colour definitions.
 * @return {Promise} The contents of the ColorBrewer JSON file
 */
ColorMap.colorBrewerFile = function() {
    if (ColorMap.colorBrewerJSON) {
        return when(ColorMap.colorBrewerJSON);
    } else {
        // store the promise so we don't send off lots of requests for the same file.
        // TODO: don't hardcode the path.  'build/TerriaJS/' can come from Terria.baseUrl, but how do we get a Terria instance?
        ColorMap.colorBrewerJSON = loadJson('build/TerriaJS/data/colorbrewer.json').then(function(j) {
            ColorMap.colorBrewerJSON = j;
            return j;
        });
        return ColorMap.colorBrewerJSON;
    }

};

/**
 * Simplified way to construct a colorMap object, using hyphenated CSS color names. For example, "red-white-hsl(240,50%,40%)".
 * @param {String} s The string to convert.
 * @return {ColorMap} The color map corresponding to the string.
 */
ColorMap.fromString = function(s) {
    if (!s) {
        return undefined;
    }

    // a marginally useful feature of this is that "red-white---blue" is a legal way to specify an offset color map.
    return ColorMap.fromArray(s.split('-'));
};

/**
 * Gets a {@link ColorMap} from a [ColorBrewer](http://colorbrewer2.org/) palette name, such as '10-class BrBG'.
 * @param {String} palette The palette for which to get a color map.
 * @return {Promise.<ColorMap>} A promise that resolves to the color map if a matching palette is found, or undefined if the palette is invalid.
 */
ColorMap.fromPalette = function(palette) {
    var colorBrewerDefaultClasses = 7;
    if (!palette) {
        return when(undefined);
    }
    var matches = palette.match(/^((\d+)-class *)?([^-]+)/i);
    if (matches) {
        var name = matches[3];
        var classes = (matches[2] ? matches[2] : colorBrewerDefaultClasses);
        return ColorMap.colorBrewerFile().then(function(j) {
            if (j && j[name] && j[name][classes]) {
                return ColorMap.fromArray(j[name][classes]);
            } else {
                return undefined;
            }
        });
    }

    return when(undefined);
};

module.exports = ColorMap;
