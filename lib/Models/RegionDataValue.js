'use strict';

/*global require*/

/**
 * Holds a collection of region data.
 *
 * @param {String[]} regionCodes The list of region codes.
 * @param {String[]} columnHeadings The list of column headings describing the values associated with each region.
 * @param {Number[][]} table An array of arrays where each array in the outer array corresponds to a single region in the regionCodes list
 *                           and each inner array has a value corresponding to each colum in columnHeadings.
 */
function RegionDataValue(regionCodes, columnHeadings, table) {
    this.regionCodes = regionCodes;
    this.columnHeadings = columnHeadings;
    this.table = table;
}

module.exports = RegionDataValue;
