'use strict';

var flatten = require('./flatten');

/**
 * Find the "product" of a set of arrays, equivalent to the python one-liner: list(itertools.product(*pools)).
 * Eg. [[a,b,c], [d], [e,f]] => [[a,d,e], [a,d,f], [b,d,e], [b,d,f], [c,d,e], [c,d,f]].
 *
 * @param  {Array[]} pools The arrays of arrays.
 * @return {Array[]} The product of the arrays.
 */
function arrayProduct(pools) {
    // This code is based on the python equivalent at https://docs.python.org/2/library/itertools.html#itertools.product :
    // def product(*args):
    //     # product('ABCD', 'xy') --> Ax Ay Bx By Cx Cy Dx Dy
    //     pools = map(tuple, args)
    //     result = [[]]
    //     for pool in pools:
    //         result = [x+[y] for x in result for y in pool]
    //     for prod in result:
    //         yield tuple(prod)
    //
    // Note for A = [1, 2, 3], B = [10, 20] in python, [a + b for a in A for b in B] = [11, 21, 12, 22, 13, 23].
    // In js, A.map(function(a) { return B.map(function(b) { return a + b}) }) = [ [ 11, 21 ], [ 12, 22 ], [ 13, 23 ] ].
    // For A = [[]], B = [1], in python [a+[b] for a in A for b in B] = [[1]].
    // In js, A.map(function(a) { return B.map(function(b) { return a.concat(b); }) }) = [ [ [ 1 ] ] ].
    // So we need to flatten the js result to make it match itertool's.
    var result = [[]];
    pools.forEach(function(pool) {
        result = flatten(result.map(function(partialResult) {
            return pool.map(function(poolMember) {
                return partialResult.concat(poolMember);
            });
        }));
    });
    return result;
}

module.exports = arrayProduct;
