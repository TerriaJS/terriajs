"use strict";
/**
 * Pre-canned colour ramps
 */

var inherit = require('../Core/inherit');

// Thoughts next up: convert to class ColorMap, and make this "initFromArray", "initFromString", "initFromName"
// Integrate through TableDataSource, moving some behaviour from there.

var ColorMap = function() {
    Array.call(this);
};

inherits(ColorMap, Array);

ColorMap.prototype.fromArray = function(colors) {
    return colorMaps.colorMapFromArray(colors);
}

colorMaps.colorMapFromArray = function (colors) {
    return colors
    .map(function(el, index) {
        var obj = {};
        obj['color'] = el;
        obj['offset'] = index/(colors.length - 1);
        return obj;
    }).filter(function(o) { return o.color !== ''; });
}

/**
  * Simplified way to construct a colorMap object, using hyphenated CSS color names. For example, "red-white-hsl(240,50%,40%)". 
  */
colorMaps.colorMapFromString = function(name) {
    if (!name) {
        return undefined;
    }
    // a secret feature of this is that "red-white---blue" is a legal way to specify an offset color map.
    return this.colorMapFromArray(name.split('-'));
}

/** Return a pre-defined and named color map. */
colorMaps.colorMapFromName = function(name) {
    return this.colorMapFromString(this.names[name]);
};

colorMaps.names = {
    'Pinks': 'rgba(239,210,193,1.00)-rgba(221,139,116,1.0)-rgba(255,127,46,1.0)-rgba(255,65,43,1.0)-rgba(111,0,54,1.0)',
    'Red-White-Blue': 'red-white-blue',
    'Green-White-Red': 'green-hsl(120,100%,70%)-white-hsl(0,100%,70%)-red',
    'Greens': 'darkgreen-green-lightgreen',
    'Blues': 'darkblue-green-lightblue'
}

module.exports = colorMaps;
