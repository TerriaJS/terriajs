'use strict';

/*global require,describe,it,expect*/

var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var unionRectangles = require('../../lib/Map/unionRectangles');

describe('unionRectangles', function() {
    it('throws when first is not provided', function() {
        expect(function() {
            unionRectangles(undefined, Rectangle.MAX_VALUE);
        }).toThrow();
    });

    it('throws when second is not provided', function() {
        expect(function() {
            unionRectangles(Rectangle.MAX_VALUE, undefined);
        }).toThrow();
    });

    it('correctly computes a union', function() {
        var rectangle1 = new Rectangle(1.0, 1.1, 1.2, 1.3);
        var rectangle2 = new Rectangle(-1.0, 0.9, 1.3, 1.4);
        expect(unionRectangles(rectangle1, rectangle2)).toEqual(new Rectangle(-1.0, 0.9, 1.3, 1.4));
    });

    it('uses the result parameter if provided', function() {
        var rectangle1 = new Rectangle(1.0, 1.1, 1.2, 1.3);
        var rectangle2 = new Rectangle(-1.0, 0.9, 1.3, 1.4);
        var output = new Rectangle();

        var result = unionRectangles(rectangle1, rectangle2, output);
        expect(result).toBe(output);
        expect(result).toEqual(new Rectangle(-1.0, 0.9, 1.3, 1.4));
    });
});