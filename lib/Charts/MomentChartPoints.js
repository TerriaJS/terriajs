"use strict";

import BaseChart from "./BaseChart";
import d3Sync from "./d3Sync";
import { select as d3Select } from "d3-selection";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

class MomentChartPoints extends BaseChart {
  constructor() {
    super();
    this.alternateYAxis = null;
    this.chartData = null;
    this.yMin = null;
    this.yMax = null;
  }

  render(chart, chartData, { chartTransform, scales, size }, alternateYAxis) {
    if (alternateYAxis !== null) {
      this.alternateYAxis = alternateYAxis.firstY;
      this.yMin = alternateYAxis.yMin;
      this.yMax = alternateYAxis.yMax;
    } else {
      this.alternateYAxis = null;
      this.yMin = 0;
      this.yMax = 1;
    }

    this.chartData = chartData;
    const ch = this;

    const n = chartData.points.length;

    const spacing =
      (scales.x(chartData.points[n - 1].x) - scales.x(chartData.points[0].x)) /
      n;

    d3Sync(
      chart,
      chartData.points,
      "circle",
      (el, isNew) =>
        el
          .attr("class", (d, i) => `dataIndex-${i}`)
          .style("fill", chartData.color || "turquoise")
          .attr("r", d => (spacing > 3 ? 5 : 3))
          .attr("cursor", "pointer")
          .style("z-index", 100)
          .style("fill-opacity", (d, i) =>
            i === chartData.selectedIndex ? 1 : 0.3
          )
          .attr("cx", d => scales.x(d.x))
          .attr("cy", function(d) {
            if (ch.alternateYAxis === null) return size.plotHeight / 2;
            const xIndex = ch._findNearestX(d.x);
            if (
              xIndex === null ||
              xIndex === ch.alternateYAxis.points.length - 2 ||
              xIndex === -1
            )
              return size.plotHeight / 2;

            // Get the location that the marker should live along the x axis
            const xAsPercentage = ch._getXAsPercentage(
              d.x,
              ch.alternateYAxis.points[xIndex].x,
              ch.alternateYAxis.points[xIndex + 1].x
            );

            // find a y value based on the x
            const interNum = d3InterpolateNumber(
              ch.alternateYAxis.points[xIndex].y,
              ch.alternateYAxis.points[xIndex + 1].y
            );
            const calculatedRawY = interNum(xAsPercentage);

            // Because the line the dots are being mapped against may not have the widest range
            // we need to adjust it's y position in the chart
            const chartHeightInterpolator = d3InterpolateNumber(
              0,
              size.plotHeight
            );
            const newMin = chartHeightInterpolator(
              ch._calcPercentageBetweenMinAndMax(
                ch.alternateYAxis.yAxisMin,
                ch.yMin,
                ch.yMax
              )
            );
            const newMax = chartHeightInterpolator(
              ch._calcPercentageBetweenMinAndMax(
                ch.alternateYAxis.yAxisMax,
                ch.yMin,
                ch.yMax
              )
            );

            return (
              size.plotHeight -
              ch._getYAsPercentage(
                calculatedRawY,
                newMin,
                newMax,
                ch.alternateYAxis.yAxisMin,
                ch.alternateYAxis.yAxisMax
              )
            );
          }),
      chartTransform
    );
  }

  zoomOnAxisX(newScaleX) {
    const n = this.chartData.points.length;

    const spacing =
      (newScaleX(this.chartData.points[n - 1].x) -
        newScaleX(this.chartData.points[0].x)) /
      n;
    d3Select(`#${this.id}`)
      .selectAll("circle")
      .attr("cx", d => newScaleX(d.x))
      .attr("r", d => (spacing > 3 ? 5 : 3));
  }

  highlightMoment(selectedIndex) {
    d3Select(`#${this.id}`)
      .selectAll("circle")
      .style("fill-opacity", 0.3)
      .filter(`.dataIndex-${selectedIndex}`)
      .style("fill-opacity", 1);
  }

  _getXAsPercentage(x, startX, endX) {
    const unixStart = new Date(startX).getTime();
    const unixEnd = new Date(endX).getTime();
    return (new Date(x).getTime() - unixStart) / (unixEnd - unixStart);
  }

  // https://stackoverflow.com/a/31687097/1979085
  _getYAsPercentage(fauxY, minAllowed, maxAllowed, min, max) {
    return (
      ((maxAllowed - minAllowed) * (fauxY - min)) / (max - min) + minAllowed
    );
  }

  _calcPercentageBetweenMinAndMax(x, min, max) {
    return (x - min) / (max - min);
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
