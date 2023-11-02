"use strict";

import d3Sync from "./d3Sync";

import BaseChart from "./BaseChart";

const barWidth = 6;

class BarChart extends BaseChart {
  render(chart, chartData, renderContext) {
    const { scales, state, chartTransition } = renderContext;
    const chartDataSets = state.data.filter(
      (data) => data.renderer instanceof BarChart
    );
    const offset =
      (barWidth * chartDataSets.length) / 2 -
      chartDataSets.indexOf(chartData) * barWidth;
    const sx = scales.x,
      sy = scales.y[chartData.units],
      color = chartData.color || "white";

    // preprocess for negative data; rect does not seem to like negative values.
    const points = chartData.points.map((p) => {
      const point = {
        x: sx(p.x) - offset,
        y: sy(p.y),
        dx: barWidth,
        dy: sy(0) - sy(p.y)
      };
      if (point.dy < 0) {
        point.y += point.dy;
        point.dy *= -1;
      }
      return point;
    });

    d3Sync(
      chart,
      points,
      "rect",
      (rect) =>
        rect
          .attr("x", (p) => p.x)
          .attr("y", (p) => p.y)
          .attr("width", (p) => p.dx)
          .attr("height", (p) => p.dy)
          .style("fill", color)
          .style("stroke", "none"),
      chartTransition
    );
  }

  getXpadding(chartData, allChartData, allRenderers) {
    return (
      (barWidth *
        allRenderers.filter((renderer) => renderer instanceof BarChart)
          .length) /
      2
    );
  }
}

module.exports = BarChart;
