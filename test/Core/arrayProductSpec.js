'use strict';

/*global require, fail*/
var arrayProduct = require('../../lib/Core/arrayProduct');

describe('arrayProduct', function() {

    it('works with one array of one', function() {
        var test = [[1]];
        var target = [[1]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with several arrays of one', function() {
        var test = [[1], [2], [3], [4]];
        var target = [[1, 2, 3, 4]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with one array of two', function() {
        var test = [[1, 10]];
        var target = [[1], [10]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with an array of two in first place', function() {
        var test = [[1, 10], [2], [3], [4]];
        var target = [[1, 2, 3, 4], [10, 2, 3, 4]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with arrays of two in the first two places', function() {
        var test = [[1, 10], [2, 20], [3], [4]];
        // Actually the order of the subarrays is not important.
        var target = [[1, 2, 3, 4], [1, 20, 3, 4], [10, 2, 3, 4], [10, 20, 3, 4]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with arrays of two in the first three places', function() {
        var test = [[1, 10], [2, 20], [3, 30], [4]];
        // Actually the order of the subarrays is not important.
        var target =  [[ 1, 2, 3, 4], [1, 2, 30, 4], [1, 20, 3, 4], [1, 20, 30, 4], [10, 2, 3, 4], [10, 2, 30, 4], [10, 20, 3, 4], [10, 20, 30, 4]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with an array of two in the final place', function() {
        var test = [[1], [2], [3], [4, 40]];
        var target = [[1, 2, 3, 4], [1, 2, 3, 40]];
        expect(arrayProduct(test)).toEqual(target);
    });

    it('works with an array of two in the final two places', function() {
        var test = [[1], [2], [3, 30], [4, 40]];
        var target = [[1, 2, 3, 4], [1, 2, 3, 40], [1, 2, 30, 4], [1, 2, 30, 40]];
        expect(arrayProduct(test)).toEqual(target);
    });

});
