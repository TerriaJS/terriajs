'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';

/**
 * @param {Array[]} [pointArrays] The array of arrays of points. Each point should have the format {x: X, y: Y}. Defaults to [].
 * @param {Object} [parameters] Further parameters.
 * @param {String[]} [parameters.ids] Unique ids for each point array. Length should match pointArrays.length. Required unless pointArrays = [].
 * @param {String[]} [parameters.categoryNames] Names of the category each point array belong to, eg. the source catalog item. Length should match pointArrays.length.
 * @param {String[]} [parameters.names] Names for each point array. Length should match pointArrays.length.
 * @param {String[]} [parameters.units] Units of each point array. Length should match pointArrays.length.
 * @param {String[]} [parameters.colors] CSS color codes for each point array. Length should match pointArrays.length.
 */
var ChartData = function(pointArrays, parameters) {
    parameters = defaultValue(parameters, defaultValue.EMPTY_OBJECT);
    /**
     * The array of arrays of points. Each point should have the format {x: X, y: Y}.
     * @type {Array[]}
     */
    this.pointArrays = defaultValue(pointArrays, []);

    /**
     * Unique ids for each point array. Length should match pointArrays.length.
     * @type {String[]}
     */
    this.ids = parameters.ids;

    /**
     * Names of the category each point array belongs to, eg. the source catalog item. Length should match pointArrays.length.
     * @type {String[]}
     */
    this.categoryNames = parameters.categoryNames;

    /**
     * Names for each point array. Length should match pointArrays.length.
     * @type {String[]}
     */
    this.names = parameters.names;

    /**
     * Units of each point array. Length should match pointArrays.length.
     * @type {String[]}
     */
    this.units = parameters.units;

    /**
     * CSS color codes for each point array. Length should match pointArrays.length.
     * @type {String[]}
     */
    this.colors = parameters.colors;

};

/**
 * Calculates the min and max x and y of all the points in all the point arrays.
 * If there are no points, returns undefined.
 * @return {Object} An object {x: [xmin, xmax], y: [ymin, ymax]}.
 */
ChartData.prototype.getDomain = function() {
    let pointArrays = this.pointArrays;
    if (!pointArrays || pointArrays.length === 0) {
        return;
    }
    return {
        x: [d3.min(pointArrays, a=>d3.min(a, d=>d.x)), d3.max(pointArrays, a=>d3.max(a, d=>d.x))],
        y: [d3.min(pointArrays, a=>d3.min(a, d=>d.y)), d3.max(pointArrays, a=>d3.max(a, d=>d.y))],
    };
};

module.exports = ChartData;
