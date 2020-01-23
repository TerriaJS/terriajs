"use strict";

import BaseChart from "./BaseChart";
import d3Sync from "./d3Sync";
import { select as d3Select } from "d3-selection";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

const defaultMarkerSizeSmall = 2;
const defaultMarkerSizeLarge = 5;

const selectedMarkerSizeSmall = 5;
const selectedMarkerSizeLarge = 8;

class MomentChartPoints extends BaseChart {
  constructor() {
    super();
    this.alternateYAxis = null;
    this._alternateYAxisFilteredPoints = null;
    this.chartData = null;
    this.yMin = null;
    this.yMax = null;
    this.lastKnownXScale = null;
  }

  render(chart, chartData, { chartTransform, scales, size }, alternateYAxis) {
    if (alternateYAxis !== null) {
      this.alternateYAxis = alternateYAxis.firstY;
      this._alternateYAxisFilteredPoints = alternateYAxis.firstY.points.filter(
        p => p.y !== null
      );
      this.yMin = alternateYAxis.yMin;
      this.yMax = alternateYAxis.yMax;
    } else {
      this.alternateYAxis = null;
      this._alternateYAxisFilteredPoints = null;
      this.yMin = 0;
      this.yMax = 1;
    }

    this.chartData = chartData;
    const ch = this;

    this.lastKnownXScale = scales.x;
    const spacing = this._calculateSpacing();

    d3Sync(
      chart,
      chartData.points,
      "circle",
      (el, isNew) =>
        el
          .attr("class", (d, i) => `dataIndex-${i}`)
          .style("fill", chartData.color || "turquoise")
          .attr("r", function(d, i) {
            if (i === chartData.selectedIndex)
              return spacing > defaultMarkerSizeSmall
                ? selectedMarkerSizeLarge
                : selectedMarkerSizeSmall;
            return spacing > defaultMarkerSizeSmall
              ? defaultMarkerSizeLarge
              : defaultMarkerSizeSmall;
          })
          .style("fill-opacity", (d, i) =>
            i === chartData.selectedIndex ? 1 : 0.3
          )
          .attr("cx", d => scales.x(d.x))
          .attr("cy", function(d) {
            if (ch.alternateYAxis === null) return size.plotHeight / 2;
            const xIndex = ch._findNearestX(d.x);
            if (
              xIndex === null ||
              xIndex === ch._alternateYAxisFilteredPoints.length - 2 ||
              xIndex === -1
            )
              return size.plotHeight / 2;

            // Get the location that the marker should live along the x axis
            const xAsPercentage = ch._getXAsPercentage(
              d.x,
              ch._alternateYAxisFilteredPoints[xIndex].x,
              ch._alternateYAxisFilteredPoints[xIndex + 1].x
            );

            // find a y value based on the x
            const interNum = d3InterpolateNumber(
              ch._alternateYAxisFilteredPoints[xIndex].y,
              ch._alternateYAxisFilteredPoints[xIndex + 1].y
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
    this.lastKnownXScale = newScaleX;

    const spacing = this._calculateSpacing();
    const chartData = this.chartData;
    d3Select(`#${this.id}`)
      .selectAll("circle")
      .attr("cx", d => newScaleX(d.x))
      .attr("r", function(d, i) {
        if (i === chartData.selectedIndex)
          return spacing > defaultMarkerSizeSmall
            ? selectedMarkerSizeLarge
            : selectedMarkerSizeSmall;
        return spacing > defaultMarkerSizeSmall
          ? defaultMarkerSizeLarge
          : defaultMarkerSizeSmall;
      });
  }

  highlightMoment(selectedIndex) {
    const spacing = this._calculateSpacing();
    this.chartData.selectedIndex = selectedIndex;
    d3Select(`#${this.id}`)
      .selectAll("circle")
      .style("fill-opacity", 0.3)
      .attr("r", d =>
        spacing > defaultMarkerSizeSmall
          ? defaultMarkerSizeLarge
          : defaultMarkerSizeSmall
      )
      .filter(`.dataIndex-${selectedIndex}`)
      .style("fill-opacity", 1)
      .attr("r", d =>
        spacing > defaultMarkerSizeSmall
          ? selectedMarkerSizeLarge
          : selectedMarkerSizeSmall
      );
  }

  _calculateSpacing() {
    const n = this.chartData.points.length;
    return (
      (this.lastKnownXScale(this.chartData.points[n - 1].x) -
        this.lastKnownXScale(this.chartData.points[0].x)) /
      n
    );
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
    for (var i = 0; i < this._alternateYAxisFilteredPoints.length; i++) {
      if (
        new Date(this._alternateYAxisFilteredPoints[i].x).getTime() >=
        xToSearchFor
      )
        return i - 1;
    }
    return null;
  }
}

module.exports = MomentChartPoints;
