"use strict";

import {
  mouse as d3Mouse,
  select as d3Select,
  event as d3Event
} from "d3-selection";
import { axisBottom as d3AxisBottom, axisLeft as d3AxisLeft } from "d3-axis";
import { transition as d3Transition } from "d3-transition";
import { zoom as d3Zoom, zoomIdentity as d3ZoomIdentity } from "d3-zoom";
import uniq from "lodash.uniq";

import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";

import Scales from "./Scales";
import Size from "./Size";
import Title from "./Title";
import Tooltip from "./Tooltip";
import { initializeChartTypes } from "./initializeChartTypes";

import d3Sync from "./d3Sync";
const yAxisLabelWidth = 20;

const defaultMargin = {
  top: 20,
  right: 30,
  bottom: 20,
  left: 0
};

const defaultNoDataText = "No preview available";

const defaultTransitionDuration = 1000; // milliseconds

// const threshold = 1e-8; // Threshold for 'equal' x-values during mouseover.

class ChartRenderer {
  constructor() {
    this.currentScaleX = null;
  }

  /**
   * Create a Chart Renderer.
   * @param  {DOMElement} container The DOM container in which to place the chart.
   * @param  {Object} state The state of the chart.
   * @param  {Number} state.width The width of the svg container.
   * @param  {Number} state.height The height of the svg container.
   * @param  {Object} [state.margin] The chart's margin.
   * @param  {Number} state.margin.top The chart's top margin.
   * @param  {Number} state.margin.right The chart's right margin.
   * @param  {Number} state.margin.bottom The chart's bottom margin.
   * @param  {Number} state.margin.left The chart's left margin.
   * @param  {Object} [state.titleSettings] Information about the title section; see Title for the available options.
   * @param  {Object} [state.domain] The x and y ranges to show; see Scales for the format.
   * @param  {ChartData[]} state.data The data for each line.
   * @param  {Object} [state.axisLabel] Labels for the x and y axis.
   * @param  {String} [state.axisLabel.x] Label for the x axis.
   * @param  {String} [state.axisLabel.y] Label for the y axis.
   * @param  {Number} [state.xAxisHeight] Height of the x-axis; used in Size.
   * @param  {Number} [state.xAxisLabelHeight] Height of the x-axis label; used in Size.
   * @param  {Object} [state.grid] Grids for the x and y axis.
   * @param  {Boolean} [state.grid.x] Do you want vertical gridlines?
   * @param  {Boolean} [state.grid.y] Do you want horizontal gridlines?
   * @param  {Boolean} [state.mini] If true, show minified axis.
   * @param  {Number} [state.transitionDuration] Duration of transition effects, in milliseconds.
   * @param  {Object} [state.tooltipSettings] Settings for the tooltip; see Tooltip for the available options.
   * @param  {Number|String} [state.highlightX] Force a particular x-position to be highlighted.
   */
  static create(container, state) {
    if (!container) {
      return;
    }

    const d3Container = d3Select(container);

    Title.create(d3Container, state.titleSettings);

    d3Container.style("position", "relative");

    const svg = d3Container
      .append("svg")
      .attr("class", "d3")
      .attr("width", state.width)
      .attr("height", state.height);
    svg
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", "0")
      .attr("y", "0");

    const chart = svg.append("g").attr("class", "base-chart");

    chart
      .append("rect")
      .attr("class", "plot-area")
      .attr("x", "0")
      .attr("y", "0");

    chart
      .append("g")
      .attr("class", "x axis")
      .append("text")
      .attr("class", "label");

    chart.append("g").attr("class", "y-axis");

    // Have the selection div below the content div
    // makes the content svg's more clickable
    chart.append("g").attr("class", "selection");

    chart.append("g").attr("class", "content");

    // With this rect above the content g the cursors aren't shown
    // when howevering over the content :(
    chart
      .append("rect")
      .attr("class", "zoom-area")
      .attr("x", "0")
      .attr("y", "0");

    chart
      .append("g")
      .attr("class", "no-data")
      .append("text");

    Tooltip.create(d3Container, state.tooltipSettings);

    this.update(container, state);
  }

  static update(container, state) {
    this.render(container, state);
  }

  static destroy(container, state) {
    Tooltip.destroy(state.tooltipSettings);
  }

  static render(container, state) {
    state.dblClickTimer = false;
    if (!defined(state.data)) {
      return;
    }

    initializeChartTypes(state);

    const data = state.data;
    const margin = defaultValue(state.margin, defaultMargin);
    const units = uniq(
      state.data.filter(data => data.type !== "moment").map(data => data.units)
    );
    const size = Size.calculate(
      container,
      margin,
      state,
      state.mini ? 1 : units.length
    );
    const scales = Scales.calculate(
      size,
      state.domain,
      state.data,
      this.getXpadding(state)
    );

    const transitionDuration = defaultValue(
      state.transitionDuration,
      defaultTransitionDuration
    );

    // The last condition in hasData checks that at least one y-value of one chart is defined.
    const hasData =
      data.length > 0 &&
      data[0].points.length > 0 &&
      data.some(d => d.points.some(p => defined(p.y)));

    const d3Container = d3Select(container);

    // Update SVG
    const chartSVGContainer = d3Container
      .select("svg")
      .attr("width", state.width)
      .attr("height", state.height)
      .style("user-select", "none")
      .style("cursor", "default");

    // Update Plot Area
    d3Container
      .select("rect.plot-area")
      .attr("width", size.width)
      .attr("height", size.plotHeight);

    //Update Clip Area
    d3Container
      .select("clipPath")
      .select("rect")
      .attr("width", size.width)
      .attr("height", size.plotHeight);

    // Update chart area
    size.yChartOffset = margin.top + Title.getHeight(state.titleSettings);
    const yOffsets =
      scales === undefined ? [] : computeYOffset(state, units, scales, size);

    // Adjust x offset
    let totalOffset;
    if (yOffsets.length > 0) {
      totalOffset = yOffsets.reduce((a, b) => a + b);
    } else {
      const remainingGap = container.clientWidth - size.width;
      totalOffset = Math.min(Size.yAxisWidth, remainingGap / 2);
    }
    size.yAxesWidth = totalOffset;

    const chartTransform =
      "translate(" +
      (margin.left + size.yAxesWidth) +
      "," +
      size.yChartOffset +
      ")";
    const chartTransition = d3Transition().duration(transitionDuration);

    const chart = d3Select(container)
      .selectAll(".base-chart")
      .attr("transform", chartTransform);
    const chartPlotContainer = chart.select(".content");

    Title.enterUpdateAndExit(
      d3Container,
      state.titleSettings,
      margin,
      state,
      transitionDuration
    );

    const renderContext = {
      // helpful baseline input
      container,
      state,

      // helpful constraints
      size,
      yOffsets,
      margin,
      scales,
      units,

      // helpful chart specifics
      chart,
      chartPlotContainer,
      chartTransform,
      chartTransition,
      chartSVGContainer
    };

    const zoom = d3Zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([[0, 0], [size.width, size.plotHeight]])
      .on("zoom", zoomed);

    const za = d3Container
      .select("rect.zoom-area")
      .attr("width", size.width)
      .attr("height", size.plotHeight)
      .style("fill", "transparent")
      .on("dblclick", () => zoom.transform(za, d3ZoomIdentity.scale(1)))
      .call(zoom);

    function zoomed() {
      if (d3Event.sourceEvent === null) {
        this.currentScaleX = null;
        return;
      }
      // TO-DO
      // I think this transform is a smidge off because of the y axis offset
      var new_xScale = d3Event.transform.rescaleX(scales.x);
      this.currentScaleX = new_xScale;
      scales.zoomedX = new_xScale;

      data.forEach(function(d) {
        d.renderer.zoomOnAxisX(new_xScale);
      });
      chart.select(".x.axis").call(xAxis.scale(new_xScale));
    }

    let xAxis = null;

    // Axes.
    if (defined(scales)) {
      const a = this.renderAxis(renderContext, hasData);
      xAxis = a.xAxis;
      this.renderChart(renderContext);
    }

    this.renderToolTip(renderContext, hasData, zoom);

    this.renderHighlight(renderContext);

    // No data. Show message if no data to show.
    this.renderNoData(renderContext, hasData);
  }

  static getXpadding(state) {
    return Math.max.apply(
      Math,
      state.data.map(cd => cd.renderer.getXpadding(cd, state))
    );
  }

  /**
   * Render each of the dataseries within a plot container.
   * @param {*} renderContext
   */
  static renderChart(renderContext) {
    d3Sync(
      renderContext.chartPlotContainer,
      renderContext.state.data,
      "g",
      chart => {
        chart.each(function(chartData, index, charts) {
          chartData.renderer.id = `chart-${index}`;
          const chart = d3Select(this)
            .attr("class", "render")
            .attr("clip-path", "url(#clip)")
            .attr("id", chartData.renderer.id);

          if (chartData.type === "momentPoints") {
            const yAxisDataset = findFirstChartWithYdata(
              renderContext.state.data
            );
            chartData.renderer.render(
              chart,
              chartData,
              renderContext,
              yAxisDataset
            );
          } else {
            chartData.renderer.render(chart, chartData, renderContext);
          }
        });
      }
    );
  }

  /**
   * Add click and mouseover handlers to highlight hovered data, and show tooltips.
   * @param {} renderContext
   */
  static renderToolTip(renderContext, hasData, zoom) {
    const { chartSVGContainer, state, scales, chart } = renderContext;
    // Hilighted data and tooltips.
    if (defined(state.tooltipSettings)) {
      const tooltip = Tooltip.select(state.tooltipSettings);

      const htParams = () => [
        hasData,
        state.data,
        state,
        scales,
        chart,
        tooltip
      ];

      chartSVGContainer
        .on("mousemove", () => highlightAndTooltip(...htParams()))
        .on("click", () =>
          highlightAndTooltip(...htParams(), false, false, true)
        )
        .on("mouseout", e => {
          // filter out mouseout events caused by mouse over an internal element like our highlight
          if (
            d3Event.relatedTarget === chartSVGContainer.node() ||
            !chartSVGContainer.node().contains(d3Event.relatedTarget)
          ) {
            unhilightDataAndHideTooltip(chart, tooltip);
          }
        });
    }
  }

  static renderHighlight(renderContext) {
    const { state, scales, chart } = renderContext;
    // Hilighted data and tooltips.
    if (defined(state.highlightX)) {
      const selectedData = findSelectedData(state.data, state.highlightX);
      highlightXAxis(selectedData, scales, chart);
    }
  }

  static renderNoData(renderContext, hasData) {
    const { container, size, margin, chart } = renderContext;

    const noData = chart
      .select(".no-data")
      .style("opacity", hasData ? 1e-6 : 1);

    noData
      .select("text")
      .text(defaultNoDataText)
      .style("text-anchor", "middle")
      .attr("x", container.offsetWidth / 2 - margin.left - size.yAxesWidth)
      .attr("y", (size.height - 24) / 2);
  }

  /**
   * Draw X and Y axes, tick marks and labels.
   * @param {Object} renderContext
   */
  static renderAxis(renderContext, hasData) {
    const {
      state,
      size,
      scales,
      units,
      chart,
      chartTransition
    } = renderContext;

    const outAxes = {
      xAxis: null,
      yAxis: null
    };

    // Create the y-axis as needed.
    // -----------------
    // y axis group
    d3Sync(chart.select(".y-axis"), units, "g", (axis, enter) => {
      // individual y axis groups

      axis = axis.attr("class", "y axis").attr("id", unit => `${unit}`);
      // subelement groups
      d3Sync(
        axis,
        ["ticks", "colors", "units-label-shadow-group", "units-label-group"],
        "g",
        sub => {
          sub.attr("class", x => x);

          sub.each(function(item) {
            if (item.match(/^units/)) {
              const node = d3Select(this);
              d3Sync(node, [""], "text", text =>
                text.attr("class", "units-label")
              );
            }
          });
        }
      );
    });

    // for each y axis
    chart
      .selectAll(".y.axis")
      .nodes()
      .forEach((node, yNodeIndex) => {
        const yNode = d3Select(node);
        const unit = units[yNodeIndex];
        const scale = scales.y[unit];

        // if (unit === undefined) return;

        const numYTicks = Math.min(6, Math.floor(size.plotHeight / 30) + 1);
        const tickValues = state.mini
          ? scale.domain()
          : Scales.truncatedTickValues(scale, numYTicks);
        //const maxTickLength = Math.max(...tickValues).toString().length;
        // const yAxisWidth = maxTickLength > 3 ? (maxTickLength - 2) * 5 : 0;
        let offset = 0;

        if (renderContext.yOffsets.length > 0 && yNodeIndex > 0) {
          offset = renderContext.yOffsets
            .slice(0, yNodeIndex)
            .reduce((a, b) => a + b);
        }
        // move subsequent axis further left
        yNode.attr("transform", `translate(${-offset},0)`);

        // build axis object
        let tickSizeInner =
          defined(state.grid) && state.grid.y ? -size.width : 3;

        if (yNodeIndex > 0) {
          tickSizeInner += yNodeIndex * -Size.yAxisWidth;
        }

        const yAxis = d3AxisLeft()
          .tickSizeOuter(units.length > 1 ? 0 : 3)
          .tickSizeInner(tickSizeInner)
          .scale(scale);
        outAxes.yAxis = yAxis;
        if (state.mini) {
          yAxis.tickSize(0, 0).tickValues(tickValues);
        } else {
          yAxis.tickValues(tickValues);
        }

        // draw axis
        const axis = yNode
          .selectAll(".ticks")
          .transition(chartTransition)
          .call(yAxis);

        const axisWidth = !isNaN(renderContext.yOffsets[yNodeIndex])
          ? renderContext.yOffsets[yNodeIndex]
          : 30;

        // for units label, rotate and position text appropriately for showing unit label
        yNode
          .selectAll(".units-label")
          .attr(
            "transform",
            `translate(${-axisWidth + yAxisLabelWidth}, ${size.yChartOffset +
              42})rotate(270)`
          )
          .text(unit || "");
        // color axis with the color of first dataset if there are multiple units
        if (units.length > 1) {
          const dataset = state.data.filter(data => data.units === unit)[0];
          axis
            .selectAll("line")
            .style("stroke", dataset.color || "white")
            .style("opacity", "0.25");
          axis.selectAll("text").style("fill", dataset.color || "white");
          axis
            .selectAll("path.domain")
            .style("stroke", dataset.color || "white");
          // matching unit color to the yaxis it represent
          yNode.selectAll(".units-label").style("fill", dataset.color);
        } else {
          axis
            .selectAll("line")
            .style("stroke", "white")
            .style("opacity", "0.25");
          axis.selectAll("text").style("fill", "white");
          if (!state.mini) {
            axis.selectAll("path.domain").style("stroke", "white");
          }
        }
      });

    // Create the x-axis as needed.
    // -----------------
    let y0 = state.mini
      ? size.plotHeight
      : Math.min(Math.max(scales.y[units[0]](0), 0), size.plotHeight);

    // If the y axis scale bar is nothing then don't plot it in the middle of the chart
    // Helps with satellite imagery
    if (scales.y.undefined) y0 = size.plotHeight;

    // // An extra calculation to decide whether we want the last automatically-generated tick value.
    // const xTickValues = Scales.truncatedTickValues(
    //   scales.x,
    //   Math.min(12, Math.floor(size.width / 150) + 1)
    // );
    const xAxis = d3AxisBottom().ticks(6);
    outAxes.xAxis = xAxis;
    if (defined(state.grid) && state.grid.x) {
      // Note this only extends up; if the axis is not at the bottom, we need to translate the ticks down too.
      xAxis.tickSizeInner(-size.plotHeight);
    }

    xAxis.scale(scales.x);

    chart
      .select(".x.axis")
      // .attr("class", "someNewX")
      .attr("clip-path", "url(#clip)")
      .attr("transform", "translate(0," + y0 + ")")
      .call(xAxis);

    if (defined(state.grid) && state.grid.x) {
      // Recall the x-axis-grid lines only extended up; we need to translate the ticks down to the bottom of the plot.
      chart
        .selectAll(".x.axis line")
        .attr("transform", "translate(0," + (size.plotHeight - y0) + ")");
    }
    // If mini with label, or no data: hide the ticks, but not the axis, so the x-axis label can still be shown.
    var hasXLabel = defined(state.axisLabel) && defined(state.axisLabel.x);
    chart
      .select(".x.axis")
      .selectAll(".tick")
      .style("opacity", 0)
      .transition(chartTransition)
      .style("opacity", (state.mini && hasXLabel) || !hasData ? 1e-6 : 1)
      .selectAll("text")
      .style("fill", "white");

    if (hasXLabel) {
      chart
        .select(".x.axis .label")
        .style("text-anchor", "middle")
        .text(state.axisLabel.x)
        // Translate the x-axis-label to the bottom of the plot, even if the x-axis itself is in the middle or the top.
        .attr(
          "transform",
          "translate(" + size.width / 2 + ", " + (size.height - y0) + ")"
        )
        .style("fill", "white");
    }
    return outAxes;
  }
}

// Returns only the data lines which have a selected point on them, with an added "point" property for the selected point.
function findSelectedData(data, x) {
  // For each chart line (pointArray), find the point with the closest x to the mouse.
  const closestXPoints = data.map(line =>
    line.points.reduce((previous, current) =>
      Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
    )
  );
  if (closestXPoints.length === 0) return [];
  let selectedPoints = null;
  let isSelectedArray = null;

  function compareUsingDates(a, b) {
    const diffTime = Math.abs(a.x.getTime() - b.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 3;
  }

  function compareUsingNumbers(a, b) {
    return Math.abs(a.x - b.x) < 1e-8;
  }

  // When the axis is a number we only want the tooltip to show those items
  // closest to the cursor else we just show all the items in the axis
  // if (typeof closestXPoints[0].x === 'number') {
  // Of those, find one with the closest x to the mouse.
  const closestXPoint = closestXPoints.reduce((previous, current) =>
    Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
  );

  const nearlyEqualX = p =>
    typeof closestXPoints[0].x.getMonth === "function"
      ? compareUsingDates(p, x)
      : compareUsingNumbers(p, closestXPoint);

  // Only select the chart lines (pointArrays) which have their closest x to the mouse = the overall closest.
  selectedPoints = closestXPoints.filter(nearlyEqualX);

  isSelectedArray = closestXPoints.map(nearlyEqualX);

  const selectedData = data.filter((line, i) => isSelectedArray[i]);

  // TODO: this adds the property to the original data - bad.
  selectedData.forEach((line, i) => {
    line.point = selectedPoints[i];
  });

  return selectedData;
}

function highlightXAxis(hoverX, scales, g) {
  const data = [{ x: hoverX, y: 0 }];
  const availableYUnits = Object.keys(scales.y);

  const verticalLine = g
    .select(".selection")
    .selectAll("line")
    .data(data);

  verticalLine
    .enter()
    .append("line")
    .merge(verticalLine)
    .attr("x1", d => (scales.zoomedX ? scales.zoomedX(d.x) : scales.x(d.x)))
    .attr(
      "y1",
      d => scales.y[availableYUnits[0] || Scales.unknownUnits].range()[0]
    )
    .attr("x2", d => (scales.zoomedX ? scales.zoomedX(d.x) : scales.x(d.x)))
    .attr(
      "y2",
      d => scales.y[availableYUnits[0] || Scales.unknownUnits].range()[1]
    );
  verticalLine.exit().remove();

  const selection = g
    .select(".selection")
    .selectAll("circle")
    .data(data);
  selection
    .enter()
    .append("circle")
    .merge(selection)
    .attr("cx", d => (scales.zoomedX ? scales.zoomedX(d.x) : scales.x(d.x)))
    // .attr("cy", d => scales.y[d.units || Scales.unknownUnits](d.y))
    .style("fill", d => (defined(d.color) ? d.color : ""));
  selection.exit().remove();
}

function highlightAndTooltip(
  hasData,
  data,
  state,
  scales,
  g,
  tooltip,
  showTooltip = true,
  showHighlight = true,
  fireClick = false
) {
  if (!hasData) {
    Tooltip.hide(tooltip);
    return;
  }
  const localCoords = d3Mouse(g.nodes()[0]);
  const hoverX = scales.zoomedX
    ? scales.zoomedX.invert(localCoords[0])
    : scales.x.invert(localCoords[0]);

  highlightXAxis(hoverX, scales, g);

  const selectedData = findSelectedData(data, hoverX);
  const chartBoundingRect = g["_parents"][0].getBoundingClientRect(); // Strangely, g's own width can sometimes be far too wide.
  if (selectedData.length === 0) {
    Tooltip.hide(tooltip);
    return;
  }
  Tooltip.show(
    Tooltip.html(selectedData),
    tooltip,
    state.tooltipSettings,
    chartBoundingRect
  );

  if (fireClick) {
    // Because double click should be used for zooming the chart out
    if (state.dblClickTimer) {
      clearTimeout(state.dblClickTimer);
      state.dblClickTimer = false;
      return;
    } else {
      state.dblClickTimer = setTimeout(function() {
        state.dblClickTimer = false;

        selectedData.forEach(chartData => {
          if (chartData.onClick) {
            chartData.onClick(hoverX); // TODO also pass Y
          }
        });
      }, 250);
    }
  }
}

function unhilightDataAndHideTooltip(g, tooltip) {
  g.select(".selection")
    .selectAll("circle")
    .data([])
    .exit()
    .remove();
  g.select(".selection")
    .selectAll("line")
    .data([])
    .exit()
    .remove();
  Tooltip.hide(tooltip);
}

function computeYOffset(state, units, scales, size) {
  const numYTicks = Math.min(6, Math.floor(size.plotHeight / 30) + 1);
  const totalOffset = [];
  units.map((unit, index) => {
    const scale = scales.y[unit];
    const tickFormat = scale.tickFormat();
    const tickValues = state.mini
      ? scale.domain()
      : Scales.truncatedTickValues(scale, numYTicks);
    const maxTickLength = Math.max(
      ...tickValues.map(v => tickFormat(v).length)
    );
    const unitLabelWidth = defined(unit) ? yAxisLabelWidth : 0;
    const offset = maxTickLength > 1 ? maxTickLength * 10 : 20;
    totalOffset.push(offset + unitLabelWidth);
  });
  return totalOffset;
}

function findFirstChartWithYdata(datasets) {
  for (var i = 0; i < datasets.length; i++) {
    if (datasets[i].type === "momentPoints" || datasets[i].type === "moment")
      continue;
    return datasets[i];
  }
  return null;
}

module.exports = ChartRenderer;
