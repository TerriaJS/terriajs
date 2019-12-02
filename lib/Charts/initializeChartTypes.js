"use strict";

import defined from "terriajs-cesium/Source/Core/defined";

import LineChart from "./LineChart";
import BarChart from "./BarChart";
import MomentChart from "./MomentChart";
import MomentChartPoints from "./MomentChartPoints";

const chartType = {
  line: new LineChart(),
  bar: new BarChart(),
  moment: new MomentChart(),
  momentPoints: new MomentChartPoints()
};

function getChart(chartType) {
  if (chartType === "line") return new LineChart();
  if (chartType === "bar") return new BarChart();
  if (chartType === "moment") return new MomentChart();
  if (chartType === "momentPoints") return new MomentChartPoints();
}

/**
 * @param  {ChartData} chartData ChartData object for which chart type needs to be determined.
 */
function determineChartType(chartData) {
  function pointsPerYear() {
    const years =
      (domain.x[1].getTime() - domain.x[0].getTime()) /
      (3600 * 24 * 365.25 * 1000);
    return numPoints / years;
  }

  function pointsPerRangeUnit() {
    const range = Math.floor(domain.x[1] - domain.x[0]);
    return numPoints / range;
  }

  const pointsWithoutY = () =>
    chartData.points.filter(p => !defined(p.y)).length;

  // respect chartData.type
  if (defined(chartType[chartData.type])) {
    return getChart(chartData.type);
  }
  const numPoints = chartData.points.length;
  if (numPoints === 0) return getChart("line");
  const domain = chartData.getDomain();
  const isDate = domain.x[0] instanceof Date;
  try {
    if (
      (isDate && pointsPerYear() < 1) ||
      (!isDate && pointsPerRangeUnit() < 1) ||
      pointsWithoutY() > 0
    ) {
      return getChart("line");
      // return chartType.bar; // TODO restore when bar charts work perfectly.
    }
  } catch (e) {
    console.error(e.stack);
  }
  return getChart("line");
}

/**
 * singleton
 */
export function initializeChartData(chartData) {
  if (chartData.renderer === undefined) {
    chartData.renderer = determineChartType(chartData);
  }
}

/**
 * Ensure that we have determined the chart type for every data item in our state.
 */
export function initializeChartTypes(state) {
  state.data.forEach(initializeChartData);
}
