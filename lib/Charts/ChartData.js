"use strict";

import { min as d3ArrayMin, max as d3ArrayMax } from "d3-array";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import { initializeChartData } from "./initializeChartTypes";

/**
 * A container to pass data to a d3 chart: a single series of data points.
 * For documentation on the custom <chart> tag, see lib/Models/registerCustomComponentTypes.js.
 *
 * @param {Object[]} [points] The array of points. Each point should have the format {x: X, y: Y}. Defaults to [].
 * @param {Object} [parameters] Further parameters.
 * @param {String} [parameters.id] Unique id for this set of points.
 * @param {String} [parameters.categoryName] Name of the category for this set of points., eg. the source catalog item.
 * @param {String} [parameters.name] Name for this set of points.
 * @param {String} [parameters.units] Units of this set of points.
 * @param {String} [parameters.color] CSS color code for this set of points.
 * @param {Number} [parameters.yAxisMin] Minimum value for y axis to display, overriding minimum value in data.
 * @param {Number} [parameters.yAxisMax] Maximum value for y axis to display, overriding maximum value in data.
 * @param {String} [parameters.type] Chart type. If you want these points to be rendered with a certain way. Leave empty for auto detection.
 * @param {Function} [parameters.onClick] Click handler (called with (x, y) in data units) if some special behaviour is required on clicking.
 * @param {Boolean} [parameters.showAll] Request that the chart be scaled so that this series can be shown entirely.
 */
var ChartData = function(points, parameters) {
  parameters = defaultValue(parameters, defaultValue.EMPTY_OBJECT);
  /**
   * The array of points. Each point should have the format {x: X, y: Y}.
   * @type {Object[]}
   */
  this.points = defaultValue(points, []);

  /**
   * A selected point from the array above. Used internally by charting functions for hover/clicking functionality.
   * @type {Object}
   */
  this.point = undefined;

  /**
   * Unique id for this set of points.
   * @type {String}
   */
  this.id = parameters.id;

  /**
   * Name of the category for this set of points., eg. the source catalog item.
   * @type {String}
   */
  this.categoryName = parameters.categoryName;

  /**
   * Name for this set of points.
   * @type {String}
   */
  this.name = parameters.name;

  /**
   * Units of this set of points.
   * @type {String}
   */
  this.units = parameters.units;

  /**
   * CSS color code for this set of points.
   * @type {String}
   */
  this.color = parameters.color;

  /**
   * Minimum value for y axis to display, overriding minimum value in data.
   * @type {String}
   */
  this.yAxisMin = parameters.yAxisMin;

  /**
   * Maximum value for y axis to display, overriding maximum value in data.
   * @type {String}
   */
  this.yAxisMax = parameters.yAxisMax;

  /**
   * Chart type. If you want these points to be rendered with a certain way. Leave empty for auto detection.
   * @type {String}
   */
  this.type = parameters.type;

  /**
   * Click handler (called with (x, y) in data units) if some special behaviour is required on clicking.
   * @type {Function}
   */
  this.onClick = parameters.onClick;

  /**
   * Request that the chart be scaled so that this series can be shown entirely.
   * @type {Boolean}
   * @default true
   */
  this.showAll = defaultValue(parameters.showAll, true);

  this.yAxisWidth = 40;

  /**
   * The selected index which you might somehow highlight on your chart
   * @type {Integer}
   */
  this.selectedIndex = defaultValue(parameters.selectedIndex, null);

  this.renderer = undefined;
};

/**
 * Calculates the min and max x and y of the points.
 * If there are no points, returns undefined.
 * @return {Object} An object {x: [xmin, xmax], y: [ymin, ymax]}.
 */
ChartData.prototype.getDomain = function() {
  const points = this.points;
  if (points.length === 0) {
    return;
  }
  return {
    x: [
      d3ArrayMin(points, point => point.x),
      d3ArrayMax(points, point => point.x)
    ],
    y: [
      d3ArrayMin(points, point => point.y),
      d3ArrayMax(points, point => point.y)
    ]
  };
};

ChartData.prototype.initializeRenderer = function() {
  initializeChartData(this);
};

module.exports = ChartData;
