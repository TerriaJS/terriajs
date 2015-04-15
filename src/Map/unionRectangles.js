'use strict';

/*global require*/
var defined = require('Cesium/Core/defined');
var DeveloperError = require('Cesium/Core/DeveloperError');
var Rectangle = require('Cesium/Core/Rectangle');

/**
 * Computes the union of two rectangles.
 * @param {Rectangle} first The first rectangle to union.
 * @param {Rectangle} second The second rectangle to union.
 * @param {Rectangle} [result] The existing {@link Rectangle} to which to copy the result instead of creating and returning a new instance.
 * @return {Rectangle} The union of the two rectangles.
 */
var unionRectangles = function(first, second, result) {
    if (!defined(first)) {
        throw new DeveloperError('first is required');
    }
    if (!defined(second)) {
        throw new DeveloperError('second is required');
    }

    var west = Math.min(first.west, second.west);
    var south = Math.min(first.south, second.south);
    var east = Math.max(first.east, second.east);
    var north = Math.max(first.north, second.north);

    if (!defined(result)) {
        result = new Rectangle(west, south, east, north);
    } else {
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
    }

    return result;
};

module.exports = unionRectangles;
