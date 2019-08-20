"use strict";

import BaseChart from "./BaseChart";
import d3Sync from "./d3Sync";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

class MomentChartPoints extends BaseChart {
  constructor() {
    super();
    this.alternateYAxis = null;
  }

  render(chart, chartData, { chartTransform, scales, size }, alternateYAxis) {
    this.alternateYAxis = alternateYAxis;
    const ch = this;

    d3Sync(
      chart,
      chartData.points,
      "circle",
      (el, isNew) =>
        el
          .attr("class", (d, i) => `dataIndex-${i}`)
          .style("fill", "white")
          .style("z-index", 100)
          .style("fill-opacity", (d, i) =>
            i === chartData.selectedIndex ? 1 : 0.3
          )
          .attr("r", 5)
          .attr("cursor", "pointer")
          .attr("cx", d => scales.x(d.x))
          .attr("cy", function(d) {
            if (ch.alternateYAxis === null) return 0;
            const xIndex = ch._findNearestX(d.x);
            if (
              xIndex === null ||
              xIndex === ch.alternateYAxis.points.length - 2
            )
              return 0;
            const xAsPercentage = ch._getXAsPercentage(
              d.x,
              ch.alternateYAxis.points[xIndex].x,
              ch.alternateYAxis.points[xIndex + 1].x
            );
            const interNum = d3InterpolateNumber(
              ch.alternateYAxis.points[xIndex].y,
              ch.alternateYAxis.points[xIndex + 1].y
            );
            const asInt = interNum(xAsPercentage);
            return ch._getYAsPercentage(
              ch.alternateYAxis.yAxisMax - asInt,
              ch.alternateYAxis.yAxisMin,
              ch.alternateYAxis.yAxisMax,
              size.plotHeight
            );
          }),
      chartTransform
    );
  }

  zoomOnAxisX(chart, newScaleX) {
    chart
      .select(".content")
      .selectAll(".render")
      .selectAll("circle")
      .attr("cx", d => newScaleX(d.x));
  }

  _getXAsPercentage(x, startX, endX) {
    const unixStart = new Date(startX).getTime();
    const unixEnd = new Date(endX).getTime();
    return (new Date(x).getTime() - unixStart) / (unixEnd - unixStart);
  }

  _getYAsPercentage(fauxY, oldMin, oldMax, chartheight) {
    return ((fauxY - oldMin) * (chartheight - 0)) / (oldMax - oldMin) + 0;
  }

  _findNearestX(x) {
    const xToSearchFor = new Date(x).getTime();
    for (var i = 0; i < this.alternateYAxis.points.length; i++) {
      if (new Date(this.alternateYAxis.points[i].x).getTime() >= xToSearchFor)
        return i - 1;
    }
    return null;
  }
}

module.exports = MomentChartPoints;
