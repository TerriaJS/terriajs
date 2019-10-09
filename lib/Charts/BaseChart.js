"use strict";

import TerriaError from "../Core/TerriaError";

class BaseChart {
  constructor() {
    this.id = null;
  }

  /**
   * Must implement this for new chart types.
   *
   * @param  {Object} chart D3Selection containing group in which the chartData elements will be charted.
   * @param  {Object} chartData ChartData object to be charted.
   * @param  {Object} renderContext Object containing various helper items which you may need for plotting.
   * @param  {DOMElement} renderContext.container The DOM container in which to place the chart.
   * @param  {Object} renderContext.state The state of the chart.
   * @param  {Object} renderContext.size ...
   * @param  {Object} renderContext.margin ...
   * @param  {Object} renderContext.scales Chart x and y Scales.
   * @param  {D3Scake} renderContext.scales.x X scale
   * @param  {Object} renderContext.scales.y Map mapping y axis units to Scakes
   * @param  {Array} renderContext.units Array of units
   * @param  {D3Selection} renderContext.chart Chart Area
   * @param  {D3Selection} renderContext.chartPlotContainer Content area under which all ChartData are rendered.
   * @param  {String} renderContext.chartTransform Transform which positions sub-elements where they should be. If you are using chart or renderContext.chart or renderContext.chartPlotContainer, they are already transformed using this. I.e. there is no need to transform again. But if you are adding a high level object, such as under renderContext.chartSVGContainer, this could be helpful.
   * @param  {D3Transition} renderContext.chartTransition Transition for animations
   * @param  {D3Selection} renderContext.chartSVGContainer The top SVG element.
   *
   */
  render(chart, chartData, renderContext) {
    throw new TerriaError("Not implemented");
  }

  /**
   * Override this if you need a little extra space around your x axis for your chart/visualisation.
   */
  getXpadding(chartData, state) {
    return 0;
  }
}

module.exports = BaseChart;
