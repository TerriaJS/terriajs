import defined from "terriajs-cesium/Source/Core/defined";
import sortedIndices from "../../../Core/sortedIndices";

/**
 * Create combined arrays from arrays of column values, eg. [[values1, values2, values3], [values4, values5]].
 * The first columns of each array must be of the same type (in the above example, values1 and values4).
 * These are combined and sorted into a single column.
 * Then the subsequent columns are added, filling with null where missing. (This could be an option in future.)
 * Eg. if the values of each col are: values1=[1,3]; values2=[10,30]; values3=[100,300]; values4=[1,2]; values5=[-1,-2];
 * then the resulting array of column values are, in order, [1,2,3]; [10,null,30]; [100,null,300]; [-1,-2,null].
 * @param {Array[]} valueArrays See description above.
 * @return {Array[]} The synthesized values which could be passed to a table structure.
 */
function combineValueArrays(valueArrays) {
  if (!defined(valueArrays) || valueArrays.length < 1) {
    return;
  }
  let combinedValueArrays = [];
  // Start by copying the first set of columns into the result.
  const firstArray = valueArrays[0];
  for (let j = 0; j < firstArray.length; j++) {
    const values = firstArray[j];
    combinedValueArrays.push(values.slice());
  }
  // Then add the subsequent sets of x-columns to the end of the first result column,
  // add nulls to the end of the other existing columns,
  // add nulls to the start of the new columns,
  // and add them to the end of the result.
  for (let i = 1; i < valueArrays.length; i++) {
    const currentValueArray = valueArrays[i];
    const currentFirstArray = currentValueArray[0];
    const preExistingValuesLength = combinedValueArrays[0].length;
    combinedValueArrays[0] = combinedValueArrays[0].concat(currentFirstArray);
    const empty1 = new Array(currentFirstArray.length); // elements are undefined.
    for (let k = 1; k < combinedValueArrays.length; k++) {
      combinedValueArrays[k] = combinedValueArrays[k].concat(empty1);
    }
    const empty2 = new Array(preExistingValuesLength); // elements are undefined.
    for (let j = 1; j < currentValueArray.length; j++) {
      const values = currentValueArray[j];
      combinedValueArrays.push(empty2.concat(values));
    }
  }

  // Sort by the first column.
  combinedValueArrays = sortByFirst(combinedValueArrays);
  combinedValueArrays = combineRepeated(combinedValueArrays);

  return combinedValueArrays;
}

/**
 * Eg. sortByFirst([['b', 'a', 'c'], [1, 2, 3]]) = [['a', 'b', 'c'], [2, 1, 3]].
 * @param  {Array[]} valueArrays The array of arrays of values to sort.
 * @return {Array[]} The values sorted by the first column.
 */
function sortByFirst(valueArrays) {
  const firstValues = valueArrays[0];
  const indices = sortedIndices(firstValues);
  return valueArrays.map(function (values) {
    return indices.map(function (sortedIndex) {
      return values[sortedIndex];
    });
  });
}

/**
 * @param  {Array[]} sortedJulianDateOrValueArrays The array of arrays of values to combine. These must be sortedByFirst. Dates must be JulianDates.
 * @param  {Integer} [firstColumnType] Eg. VarType.TIME.
 * @return {Array[]} The values, with any repeats in the first column combined into one. Dates are converted to ISO8601 string representation.
 *
 * Eg.
 * var x = [['a', 'b', 'b', 'c'], [1, 2, undefined, 3], [4, undefined, 5, undefined]];
 * combineRepeated(x);
 * # x is [['a', 'b', 'c'], [1, 2, 3], [4, 5, undefined]].
 */
function combineRepeated(sortedValueArrays) {
  const result = new Array(sortedValueArrays.length);
  for (let i = 0; i < result.length; i++) {
    result[i] = [sortedValueArrays[i][0]];
  }
  for (let j = 1; j < sortedValueArrays[0].length; j++) {
    if (sortedValueArrays[0][j] === sortedValueArrays[0][j - 1]) {
      const currentIndex = result[0].length - 1;
      for (let i = 0; i < result.length; i++) {
        if (result[i][currentIndex] === undefined) {
          result[i][currentIndex] = sortedValueArrays[i][j];
        }
      }
    } else {
      for (let i = 0; i < result.length; i++) {
        result[i].push(sortedValueArrays[i][j]);
      }
    }
  }
  return result;
}

/**
 * Convert an array of column values, with column names, to an array of row values.
 * @param  {Array[]} columnValueArrays Array of column values, eg. [[1,2,3], [4,5,6]].
 * @param  {String[]} columnNames Array of column names, eg ['x', 'y'].
 * @return {Array[]} Array of rows, starting with the column names, eg. [['x', 'y'], [1, 4], [2, 5], [3, 6]].
 */
function toArrayOfRows(columnValueArrays, columnNames) {
  if (columnValueArrays.length < 1) {
    return;
  }
  const rows = columnValueArrays[0].map(function (value0, rowIndex) {
    return columnValueArrays.map(function (values) {
      return values[rowIndex];
    });
  });
  rows.unshift(columnNames);
  return rows;
}

onmessage = function (event) {
  const valueArrays = event.data.values.map((valuesArray) =>
    valuesArray.map((values) => Array.prototype.slice.call(values))
  ); // Convert from typed arrays.
  const nameArrays = event.data.names;
  const combinedValues = combineValueArrays(valueArrays);
  const rows = toArrayOfRows(combinedValues, nameArrays);
  const joinedRows = rows.map(function (row) {
    return row.join(",");
  });
  const csvString = joinedRows.join("\n");
  postMessage(csvString);
};
