"use strict";

import BaseChart from "./BaseChart";
import d3Sync from "./d3Sync";
import { select as d3Select } from "d3-selection";

class MomentChart extends BaseChart {
  constructor() {
    super();
  }

  render(chart, chartData, { chartTransform, scales, size }) {
    const n = chartData.points.length;
    // spacing is the number of pixels per data point. When it's very low, we want to make the lines
    // thinner and lighter
    const spacing =
      (scales.x(chartData.points[n - 1].x) - scales.x(chartData.points[0].x)) /
      n;
    d3Sync(chart, chartData.points, "rect", function(el, isNew) {
      el.attr("class", (d, i) => `dataIndex-${i}`)
        .style("fill", chartData.color || "turquoise")
        .attr("fill-opacity", function(d, i) {
          return i === chartData.selectedIndex ? 1 : spacing > 3 ? 0.4 : 0.2;
        })
        .attr("x", d => scales.x(d.x))
        .attr("y", 0)
        .attr("width", function(d, i) {
          return i === chartData.selectedIndex ? 3 : 1;
          // return spacing > 20 ? 3 : 1;
        })
        .attr("height", size.plotHeight)
        .attr("cursor", "pointer");
    });
  }

  highlightMoment(selectedIndex) {
    d3Select(`#${this.id}`)
      .selectAll("rect")
      .style("fill-opacity", 0.2)
      .style("width", 1)
      .filter(`.dataIndex-${selectedIndex}`)
      .style("fill-opacity", 1)
      .style("width", 3);
  }

  zoomOnAxisX(newScaleX) {
    d3Select(`#${this.id}`)
      .selectAll("rect")
      .attr("x", d => newScaleX(d.x));
  }
}

module.exports = MomentChart;
