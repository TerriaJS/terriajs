"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var loadJson = require("../Core/loadJson");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var inherit = require("../Core/inherit");

/**
 * A one-dimensional scale of colours used to visually represent a numerical value.
 * Implemented as an Array of {color, offset} objects, where the first object has an offset of 0,
 * the last has an offset of 1, and the others are ordered in between.
 * It can be instantiated directly from three formats:
 *  - String, eg. 'red-black'
 *  - Array of strings, eg. ['red', 'black']
 *  - Array of objects with the properties 'color' and 'offset', eg. [{color: 'red', offset: 0}, ...].
 *
 * @param {String|String[]|Object[]} param
 */
var ColorMap = function(param) {
  var array;
  if (typeof param === "string" || param instanceof String) {
    array = stringToArray(param);
  }
  if (param instanceof Array && param.length > 0) {
    if (typeof param[0] === "string" || param[0] instanceof String) {
      array = simpleArrayToArray(param);
    } else {
      array = param;
    }
  }
  // array is now an array of objects with the properties 'color' and 'offset'.
  if (defined(array)) {
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

/**
 * Given a simple array of css color strings, eg. ["red", "orange", "black"],
 * return an evenly spaced array suitable to instantiate a color map.
 * @private
 * @param  {String[]} simpleArray A simple array of css color strings, eg. ["red", "orange", "black"].
 * @return {Object[]} An array of {color, offset} objects.
 */
function simpleArrayToArray(simpleArray) {
  return simpleArray
    .map(function(el, index) {
      return {
        color: el,
        offset: simpleArray.length === 1 ? 0 : index / (simpleArray.length - 1)
      };
    })
    .filter(function(o) {
      return o.color !== "";
    });
}

/**
 * Convert 'red-black' to ['red', 'black'].
 * @private
 * @param  {String} s A hyphen-separated css color string.
 * @return {String[]} An array of css color strings, split by hyphen.
 */
function stringToArray(s) {
  if (!s) {
    return undefined;
  }
  // a marginally useful feature of this is that "red-white---blue" is a legal way to specify an offset color map.
  return simpleArrayToArray(s.split("-"));
}

/**
 * Access the Color Brewer color definitions.
 * @return {Promise} The contents of the ColorBrewer JSON file
 */
ColorMap.colorBrewerFile = function() {
  if (ColorMap.colorBrewerJSON) {
    return when(ColorMap.colorBrewerJSON);
  } else {
    // store the promise so we don't send off lots of requests for the same file.
    // TODO: don't hardcode the path.  'build/TerriaJS/' can come from Terria.baseUrl, but how do we get a Terria instance?
    ColorMap.colorBrewerJSON = loadJson(
      "build/TerriaJS/data/colorbrewer.json"
    ).then(function(j) {
      ColorMap.colorBrewerJSON = j;
      return j;
    });
    return ColorMap.colorBrewerJSON;
  }
};

/**
 * Returns a promise resolving to the color map specified by the specified color palette.
 * @param {String} [colorPalette] A [ColorBrewer](http://colorbrewer2.org/) palette name, eg. "7-class Set3" or "10-class BrBG".
 * @return {Promise.<ColorMap>} A promise that resolves to the {@link ColorMap} once it is loaded, or undefined if the palette is invalid.
 */
ColorMap.loadFromPalette = function(palette) {
  var colorBrewerDefaultClasses = 7;
  if (!palette) {
    return when(undefined);
  }
  var matches = palette.match(/^((\d+)-class *)?([^-]+)/i);
  if (matches) {
    var name = matches[3];
    var classes = matches[2] ? matches[2] : colorBrewerDefaultClasses;
    return ColorMap.colorBrewerFile().then(function(j) {
      if (j && j[name] && j[name][classes]) {
        return new ColorMap(simpleArrayToArray(j[name][classes]));
      } else {
        return undefined;
      }
    });
  }
  return when(undefined);
};

module.exports = ColorMap;
