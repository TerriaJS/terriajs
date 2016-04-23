'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var unionRectangles = require('./unionRectangles');

/**
 * Computes the union of an array of rectangles.  This function is not 180-meridian safe.
 * @param  {Rectangle[]} rectangles The array of rectangles to union.
 * @return {Rectangle} The union of the rectangles, or undefined if the array of rectangles is empty.
 */
var unionRectangleArray = function(rectangles) {
    var result;
    for (var i = 0; i < rectangles.length; ++i) {
        if (!defined(rectangles[i])) {
            continue;
        }

        if (!defined(result)) {
            result = Rectangle.clone(rectangles[i]);
        } else {
            var rectangle = rectangles[i];
            if (defined(rectangle)) {
                result = unionRectangles(result, rectangle, result);
            }
        }
    }

    return result;
};

module.exports = unionRectangleArray;
