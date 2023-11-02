"use strict";

/**
 * Flattens an array of arrays, into an array, eg. [[0, 1], [2, 3], [4, 5]] => [0, 1, 2, 3, 4, 5].
 * Based on the example at
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce

 */
export default function flatten<T>(arrayOfArrays: T[][]): T[] {
  return arrayOfArrays.reduce(function (a, b) {
    return a.concat(b);
  }, []);
}
