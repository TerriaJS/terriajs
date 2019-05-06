"use strict";

/**
 * Holds a collection of region data.
 *
 * @param {String[]} regionCodes The list of region codes.
 * @param {String[]} columnHeadings The list of column headings describing the values associated with each region.
 * @param {Number[][]} table An array of arrays where each array in the outer array corresponds to a single region in the regionCodes list
 *                           and each inner array has a value corresponding to each colum in columnHeadings.  For a {@link RegionDataParameter#singleSelect}
 *                           parameter, this property should be undefined.
 * @param {Number[]} singleSelectValues The single value for each region.  For a parameter that is not {@link RegionDataParameter#singleSelect}, this
 *                                      property should be undefined.
 */
function RegionDataValue(
  regionCodes,
  columnHeadings,
  table,
  singleSelectValues
) {
  this.regionCodes = regionCodes;
  this.columnHeadings = columnHeadings;
  this.table = table;
  this.singleSelectValues = singleSelectValues;
}

module.exports = RegionDataValue;
