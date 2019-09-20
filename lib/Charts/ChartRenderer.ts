"use strict";

import { axisBottom as d3AxisBottom, axisLeft as d3AxisLeft } from "d3-axis";
import {
  event as d3Event,
  mouse as d3Mouse,
  select as d3Select
} from "d3-selection";
import { transition as d3Transition } from "d3-transition";
import uniq from "lodash-es/uniq";
import { autorun, computed, IReactionDisposer, observable, trace } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import filterOutUndefined from "../Core/filterOutUndefined";
import Chartable from "../Models/Chartable";
import { BaseModel } from "../Models/Model";
import raiseErrorOnRejectedPromise from "../Models/raiseErrorOnRejectedPromise";
import Styles from "../ReactViews/Custom/Chart/chart.scss";
import BaseChart from "./BaseChart";
import ChartData, { ChartPoint } from "./ChartData";
import d3Sync from "./d3Sync";
import { determineChartType } from "./initializeChartTypes";
import Scales from "./Scales";
import Size from "./Size";
import Title from "./Title";
import Tooltip from "./Tooltip";

const yAxisLabelWidth = 20;

const defaultMargin = {
  top: 20,
  right: 30,
  bottom: 20,
  left: 0
};

const defaultNoDataText = "No preview available";

const defaultTransitionDuration = 1000; // milliseconds

const threshold = 1e-8; // Threshold for 'equal' x-values during mouseover.
const defaultHeight = 100;

interface ChartRendererProps {
  width?: string | number;
  height?: string | number;
  styling?: "feature-info" | "histogram" | "normal";
  items: BaseModel[];
  highlightX?: string | number;
  transitionDuration?: number;
  grid?: { x: boolean; y: boolean };
  axisLabel?: { x: string; y: string };
}

type SelectedChartData = {
  point: { x: any; y: any };
  units: string | undefined;
  color: string | undefined;
  name: string | undefined;
  onClick?: (x: number, y: number) => void | undefined;
};

class ChartRenderer {
  readonly element: HTMLElement;

  @observable.struct
  props: ChartRendererProps;

  private disposeAutorun: IReactionDisposer;
  private readonly id = createGuid();

  /**
   * Create a Chart Renderer.
   * @param  {DOMElement} container The DOM container in which to place the chart.
   * @param  {Object} options The state of the chart.
   * @param  {Number} options.width The width of the svg container.
   * @param  {Number} options.height The height of the svg container.
   * @param  {Object} [options.margin] The chart's margin.
   * @param  {Number} options.margin.top The chart's top margin.
   * @param  {Number} options.margin.right The chart's right margin.
   * @param  {Number} options.margin.bottom The chart's bottom margin.
   * @param  {Number} options.margin.left The chart's left margin.
   * @param  {Object} [options.titleSettings] Information about the title section; see Title for the available options.
   * @param  {Object} [options.domain] The x and y ranges to show; see Scales for the format.
   * @param  {ChartData[]} options.chartItems The data for each line.
   * @param  {Object} [options.axisLabel] Labels for the x and y axis.
   * @param  {String} [options.axisLabel.x] Label for the x axis.
   * @param  {String} [options.axisLabel.y] Label for the y axis.
   * @param  {Number} [options.xAxisHeight] Height of the x-axis; used in Size.
   * @param  {Number} [options.xAxisLabelHeight] Height of the x-axis label; used in Size.
   * @param  {Object} [options.grid] Grids for the x and y axis.
   * @param  {Boolean} [options.grid.x] Do you want vertical gridlines?
   * @param  {Boolean} [options.grid.y] Do you want horizontal gridlines?
   * @param  {Boolean} [options.mini] If true, show minified axis.
   * @param  {Number} [options.transitionDuration] Duration of transition effects, in milliseconds.
   * @param  {Object} [options.tooltipSettings] Settings for the tooltip; see Tooltip for the available options.
   * @param  {Number|String} [options.highlightX] Force a particular x-position to be highlighted.
   */
  constructor(element: HTMLElement, props: ChartRendererProps) {
    this.element = element;
    this.props = props;

    this.disposeAutorun = autorun(() => this.autoUpdateChart());
  }

  destroy() {
    this.disposeAutorun();
    //d3Select(`#${this.svgId}`).remove();
    d3Select(this.element)
      .selectAll("*")
      .remove();
  }

  @computed
  get svgId() {
    return `chart-${this.id}`;
  }

  @computed
  get styling(): "feature-info" | "histogram" | "normal" {
    return this.props.styling || "normal";
  }

  @computed
  get titleSettings() {
    return this.styling === "normal"
      ? {
          type: "legend",
          height: 30
        }
      : undefined;
  }

  @computed
  get tooltipSettings() {
    return !defined(this.props.highlightX) && this.styling !== "feature-info"
      ? {
          className: Styles.toolTip,
          id: `tooltip-${this.id}`,
          align: "prefer-right", // With right/left alignment, the offset is relative to the svg, so need to inset.
          offset: { top: 40, left: 33, right: 30, bottom: 5 }
        }
      : undefined;
  }

  @computed
  get width() {
    return this.props.width || "100%";
  }

  @computed
  get height() {
    return this.props.height || defaultHeight;
  }

  @computed({
    keepAlive: true
  })
  get svg(): any {
    trace();

    const d3Container = d3Select(this.element);

    // Remove the old chart, if any.
    d3Select(this.element)
      .selectAll("*")
      .remove();

    Title.create(d3Container, this.titleSettings);

    d3Container.style("position", "relative");

    const svg = d3Container
      .append("svg")
      .attr("id", this.svgId)
      .attr("class", "d3")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("user-select", "none")
      .style("cursor", "default");

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

    chart.append("g").attr("class", "content");

    chart
      .append("g")
      .attr("class", "no-data")
      .append("text");

    chart.append("g").attr("class", "selection");

    Tooltip.create(d3Container, this.tooltipSettings);

    return svg;
  }

  /**
   * Gets all the chart items shown on this chart.
   */
  @computed
  get chartItems() {
    const x = this.props.items.reduce(
      (p, c) => {
        if (Chartable.is(c)) {
          return p.concat(c.chartItems);
        }
        return p;
      },
      [] as ChartData[]
    );
    return x;
  }

  /**
   * Gets the unique units shown on this chart.
   */
  @computed
  get units() {
    return filterOutUndefined(
      uniq(
        this.chartItems
          .filter(data => data.type !== "moment")
          .map(data => data.units)
      )
    );
  }

  /**
   * Gets the chart renderers for each chart item. This returns a parallel
   * array to {@link ChartRenderer#chartItems}.
   */
  @computed
  get renderers(): BaseChart[] {
    return this.chartItems.map(item => determineChartType(item));
  }

  @computed
  get margin(): { top: number; left: number; bottom: number; right: number } {
    if (this.styling === "histogram") {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    } else if (this.styling === "normal") {
      return {
        top: 8,
        right: 16,
        bottom: 20,
        left: 0
      };
    } else {
      return defaultMargin;
    }
  }

  @computed
  get size(): any {
    // Be sure the SVG exists; the size depends on it.
    const svg = this.svg;

    const sizeOptions = {
      ...this.props,
      mini: this.styling === "feature-info",
      titleSettings: this.titleSettings
    };

    return Size.calculate(
      this.element,
      this.margin,
      sizeOptions,
      this.props.styling === "feature-info" ? 1 : this.units.length
    );
  }

  @computed
  get scales(): { x: any; y: { [unit: string]: any } } {
    return Scales.calculate(
      this.size,
      undefined, // TODO: do we ever have a domain?
      this.chartItems,
      ChartRenderer.getXpadding(this.chartItems, this.renderers)
    );
  }

  @computed
  get yOffsets() {
    return this.computeYOffset(this.units, this.scales, this.size);
  }

  @computed
  get transitionDuration(): number {
    return defaultValue(
      this.props.transitionDuration,
      defaultTransitionDuration
    );
  }

  private autoUpdateChart() {
    // Ensure the items on the chart are loaded.
    this.props.items.forEach(item => {
      if (Chartable.is(item)) {
        return raiseErrorOnRejectedPromise(item.loadChartItems());
      }
      return Promise.resolve();
    });

    const chartSVGContainer = this.svg;
    const chartItems = this.chartItems;
    const renderers = this.renderers;

    const units = this.units;

    const size = this.size;
    const scales = this.scales;

    const transitionDuration = this.transitionDuration;

    // The last condition in hasData checks that at least one y-value of one chart is defined.
    const hasData =
      chartItems.length > 0 &&
      chartItems[0].points.length > 0 &&
      chartItems.some(d => d.points.some(p => defined(p.y)));

    // Update Plot Area
    const plotArea = chartSVGContainer.select("rect.plot-area");
    plotArea.attr("width", size.width).attr("height", size.plotHeight);

    // Update chart area
    size.yChartOffset = this.margin.top + Title.getHeight(this.titleSettings);
    const yOffsets = this.yOffsets;

    // Adjust x offset
    let totalOffset;
    if (yOffsets.length > 0) {
      totalOffset = yOffsets.reduce((a, b) => a + b);
    } else {
      const remainingGap = this.element.clientWidth - size.width;
      totalOffset = Math.min(Size.yAxisWidth, remainingGap / 2);
    }
    size.yAxesWidth = totalOffset;

    Title.enterUpdateAndExit(
      chartSVGContainer,
      this.titleSettings,
      this.margin,
      this.props.items,
      transitionDuration
    );

    const transition = d3Transition().duration(this.transitionDuration as any);

    // Axes.
    if (defined(scales)) {
      this.renderAxis(transition, hasData);
    }

    this.renderChart();

    this.renderToolTip(hasData);

    this.renderHighlight();

    // No data. Show message if no data to show.
    this.renderNoData(hasData);
  }

  static getXpadding(chartItems: ChartData[], renderers: BaseChart[]) {
    return Math.max.apply(
      Math,
      chartItems.map((cd, i) =>
        renderers[i].getXpadding(cd, chartItems, renderers)
      )
    );
  }

  /**
   * Render each of the dataseries within a plot container.
   */
  renderChart() {
    const chartTransform = `translate(${this.margin.left +
      this.size.yAxesWidth},${this.size.yChartOffset})`;
    const chart = this.svg
      .selectAll(".base-chart")
      .attr("transform", chartTransform);

    const chartRenderer = this;
    const renderers = this.renderers;
    const chartPlotContainer = chart.select(".content");
    d3Sync(chartPlotContainer, this.chartItems, "g", (chart: any /*TODO?*/) => {
      chart.each(function(this: any, chartData: ChartData, index: number) {
        const chart = d3Select(this)
          .attr("class", "render")
          .attr("id", chartData.id || "");
        renderers[index].render(chart, chartData, chartRenderer);
      });
    });
  }
  /**
   * Add click and mouseover handlers to highlight hovered data, and show tooltips.
   */
  renderToolTip(hasData: boolean) {
    // Hilighted data and tooltips.
    if (defined(this.tooltipSettings)) {
      const tooltip = Tooltip.select(this.tooltipSettings);

      this.svg
        .on("mousemove", () =>
          highlightAndTooltip(
            hasData,
            this.chartItems,
            this,
            this.scales,
            this.svg.selectAll(".base-chart"),
            tooltip
          )
        )
        .on("click", () =>
          highlightAndTooltip(
            hasData,
            this.chartItems,
            this,
            this.scales,
            this.svg.selectAll(".base-chart"),
            tooltip,
            false,
            false,
            true
          )
        )
        .on("mouseout", (e: MouseEvent) => {
          // filter out mouseout events caused by mouse over an internal element like our highlight
          if (
            d3Event.relatedTarget === this.svg.node() ||
            !this.svg.node().contains(d3Event.relatedTarget)
          ) {
            unhilightDataAndHideTooltip(
              this.svg.selectAll(".base-chart"),
              tooltip
            );
          }
        });
    }
  }

  renderHighlight() {
    // Hilighted data and tooltips.
    if (defined(this.props.highlightX)) {
      const selectedData = findSelectedData(
        this.chartItems,
        this.props.highlightX
      );
      const chart = this.svg.selectAll(".base-chart");
      if (selectedData) {
        hilightData(selectedData, this.scales, chart);
      }
    }
  }

  renderNoData(hasData: boolean) {
    const chart = this.svg.selectAll(".base-chart");
    const noData = chart
      .select(".no-data")
      .style("opacity", hasData ? 1e-6 : 1);

    noData
      .select("text")
      .text(defaultNoDataText)
      .style("text-anchor", "middle")
      .attr(
        "x",
        this.element.offsetWidth / 2 - this.margin.left - this.size.yAxesWidth
      )
      .attr("y", (this.size.height - 24) / 2);
  }

  /**
   * Draw X and Y axes, tick marks and labels.
   * @param {Object} renderContext
   */
  renderAxis(chartTransition: any, hasData: boolean) {
    const chart = this.svg.selectAll(".base-chart");
    // Create the y-axis as needed.
    // -----------------
    // y axis group
    d3Sync(
      chart.select(".y-axis"),
      this.units,
      "g",
      (axis: any, enter: any) => {
        // individual y axis groups
        axis = axis
          .attr("class", "y axis")
          .attr("id", (unit: any) => `${unit}`);
        // subelement groups
        d3Sync(
          axis,
          ["ticks", "colors", "units-label-shadow-group", "units-label-group"],
          "g",
          (sub: any) => {
            sub.attr("class", (x: any) => x);

            sub.each(function(this: any, item: any) {
              if (item.match(/^units/)) {
                const node = d3Select(this);
                d3Sync(node as any, [""], "text", (text: any) =>
                  text.attr("class", "units-label")
                );
              }
            });
          }
        );
      }
    );

    // for each y axis
    chart
      .selectAll(".y.axis")
      .nodes()
      .forEach((node: any, yNodeIndex: number) => {
        const yNode = d3Select(node);
        const unit = this.units[yNodeIndex];
        const scale = this.scales.y[unit];

        const numYTicks = Math.min(
          6,
          Math.floor(this.size.plotHeight / 30) + 1
        );
        const tickValues =
          this.styling === "feature-info"
            ? scale.domain()
            : Scales.truncatedTickValues(scale, numYTicks);
        //const maxTickLength = Math.max(...tickValues).toString().length;
        // const yAxisWidth = maxTickLength > 3 ? (maxTickLength - 2) * 5 : 0;
        let offset = 0;

        if (this.yOffsets.length > 0 && yNodeIndex > 0) {
          offset = this.yOffsets
            .slice(0, yNodeIndex)
            .reduce((a: number, b: number) => a + b);
        }
        // move subsequent axis further left
        yNode.attr("transform", `translate(${-offset},0)`);

        // build axis object
        let tickSizeInner =
          this.props.grid !== undefined && this.props.grid.y
            ? -this.size.width
            : 3;

        if (yNodeIndex > 0) {
          tickSizeInner += yNodeIndex * -Size.yAxisWidth;
        }

        const yAxis = d3AxisLeft(scale)
          .tickSizeOuter(this.units.length > 1 ? 0 : 3)
          .tickSizeInner(tickSizeInner);

        if (this.styling === "feature-info") {
          yAxis.tickSize(0).tickValues(tickValues);
        } else {
          yAxis.tickValues(tickValues);
        }

        // draw axis
        const axis = yNode
          .selectAll(".ticks")
          .transition(chartTransition as any)
          .call(yAxis as any);

        const axisWidth = !isNaN(this.yOffsets[yNodeIndex])
          ? this.yOffsets[yNodeIndex]
          : 30;

        // for units label, rotate and position text appropriately for showing unit label
        yNode
          .selectAll(".units-label")
          .attr(
            "transform",
            `translate(${-axisWidth + yAxisLabelWidth}, ${this.size
              .yChartOffset + 42})rotate(270)`
          )
          .text(unit || "");

        // color axis with the color of first dataset if there are multiple units
        if (this.units.length > 1) {
          const dataset = this.chartItems.filter(
            data => data.units === unit
          )[0];
          axis
            .selectAll("line")
            .style("stroke", dataset.color || "white")
            .style("opacity", "0.25");
          axis.selectAll("text").style("fill", dataset.color || "white");
          axis
            .selectAll("path.domain")
            .style("stroke", dataset.color || "white");
          // matching unit color to the yaxis it represent
          yNode
            .selectAll(".units-label")
            .style("fill", dataset.color || "white");
        } else {
          axis
            .selectAll("line")
            .style("stroke", "white")
            .style("opacity", "0.25");
          axis.selectAll("text").style("fill", "white");
          if (this.styling !== "feature-info") {
            axis.selectAll("path.domain").style("stroke", "white");
          }
        }
      });

    // Create the x-axis as needed.
    // -----------------

    const y0 =
      this.styling === "feature-info"
        ? this.size.plotHeight
        : Math.min(
            Math.max(this.scales.y[this.units[0]](0), 0),
            this.size.plotHeight
          );

    // An extra calculation to decide whether we want the last automatically-generated tick value.
    const xTickValues = Scales.truncatedTickValues(
      this.scales.x,
      Math.min(12, Math.floor(this.size.width / 150) + 1)
    );
    const xAxis = d3AxisBottom(this.scales.x).tickValues(xTickValues);

    if (this.props.grid !== undefined && this.props.grid.x) {
      // Note this only extends up; if the axis is not at the bottom, we need to translate the ticks down too.
      xAxis.tickSizeInner(-this.size.plotHeight);
    }

    xAxis.scale(this.scales.x);

    chart
      .select(".x.axis")
      .attr("transform", "translate(0," + y0 + ")")
      .call(xAxis);

    if (this.props.grid !== undefined && this.props.grid.x) {
      // Recall the x-axis-grid lines only extended up; we need to translate the ticks down to the bottom of the plot.
      chart
        .selectAll(".x.axis line")
        .attr("transform", "translate(0," + (this.size.plotHeight - y0) + ")");
    }
    // If mini with label, or no data: hide the ticks, but not the axis, so the x-axis label can still be shown.
    var hasXLabel =
      this.props.axisLabel !== undefined &&
      this.props.axisLabel.x !== undefined;
    chart
      .select(".x.axis")
      .selectAll(".tick")
      .style("opacity", 0)
      .transition(chartTransition)
      .style(
        "opacity",
        (this.styling === "feature-info" && hasXLabel) || !hasData ? 1e-6 : 1
      )
      .selectAll("text")
      .style("fill", "white");

    if (hasXLabel) {
      chart
        .select(".x.axis .label")
        .style("text-anchor", "middle")
        .text(this.props.axisLabel!.x)
        // Translate the x-axis-label to the bottom of the plot, even if the x-axis itself is in the middle or the top.
        .attr(
          "transform",
          "translate(" +
            this.size.width / 2 +
            ", " +
            (this.size.height - y0) +
            ")"
        )
        .style("fill", "white");
    }
  }

  private computeYOffset(units: string[], scales: any, size: any) {
    const numYTicks = Math.min(6, Math.floor(size.plotHeight / 30) + 1);
    const totalOffset: number[] = [];
    units.map((unit, index) => {
      const scale = unit === undefined ? undefined : scales.y[unit];
      const tickFormat = scale.tickFormat();
      const tickValues =
        this.styling === "feature-info"
          ? scale.domain()
          : Scales.truncatedTickValues(scale, numYTicks);
      const maxTickLength = Math.max(
        ...tickValues.map((v: any) => tickFormat(v).length)
      );
      const unitLabelWidth = defined(unit) ? yAxisLabelWidth : 0;
      const offset = maxTickLength > 1 ? maxTickLength * 10 : 20;
      totalOffset.push(offset + unitLabelWidth);
    });
    return totalOffset;
  }
}

// Returns only the data lines which have a selected point on them, with an added "point" property for the selected point.
function findSelectedData(
  chartItems: ChartData[],
  x: string | number | undefined
): SelectedChartData[] | undefined {
  if (x === undefined) {
    return undefined;
  }
  // For each chart line (pointArray), find the point with the closest x to the mouse.
  const closestXPoints = chartItems.map(line =>
    line.points.reduce((previous, current) =>
      Math.abs(+current.x - +x) < Math.abs(+previous.x - +x)
        ? current
        : previous
    )
  );
  // Of those, find one with the closest x to the mouse.
  const closestXPoint = closestXPoints.reduce((previous, current) =>
    Math.abs(+current.x - +x) < Math.abs(+previous.x - +x) ? current : previous
  );
  const nearlyEqualX = (thisPoint: ChartPoint) =>
    Math.abs(+thisPoint.x - +closestXPoint.x) < threshold;
  // Only select the chart lines (pointArrays) which have their closest x to the mouse = the overall closest.
  const selectedPoints = closestXPoints.filter(nearlyEqualX);

  const isSelectedArray = closestXPoints.map(nearlyEqualX);
  const selectedData = chartItems.filter((line, i) => isSelectedArray[i]);

  // Add .point to each of the selectedData
  return selectedData.map((line, i) => {
    return { ...line, point: selectedPoints[i] };
  });
}

function hilightData(
  selectedData: SelectedChartData[],
  scales: {
    x: any;
    y: {
      [unit: string]: any;
    };
  },
  g: any
) {
  // console.log('highlightData!')
  const verticalLine = g
    .select(".selection")
    .selectAll("line")
    .data(selectedData.length > 0 ? [selectedData[0]] : []);
  verticalLine
    .enter()
    .append("line")
    .merge(verticalLine) // New pattern in d3 v4.0 https://github.com/d3/d3/blob/master/CHANGES.md#selections-d3-selection
    .attr("x1", (d: any) => scales.x(d.point.x))
    .attr("y1", (d: any) => scales.y[d.units || Scales.unknownUnits].range()[0])
    .attr("x2", (d: any) => scales.x(d.point.x))
    .attr(
      "y2",
      (d: any) => scales.y[d.units || Scales.unknownUnits].range()[1]
    );
  verticalLine.exit().remove();

  const selection = g
    .select(".selection")
    .selectAll("circle")
    .data(selectedData);
  selection
    .enter()
    .append("circle")
    .merge(selection)
    .attr("cx", (d: any) => scales.x(d.point.x))
    .attr("cy", (d: any) => scales.y[d.units || Scales.unknownUnits](d.point.y))
    .style("fill", (d: any) => (defined(d.color) ? d.color : ""));
  selection.exit().remove();
}

function highlightAndTooltip(
  hasData: boolean,
  data: ChartData[],
  state: ChartRenderer,
  scales: {
    x: any;
    y: {
      [unit: string]: any;
    };
  },
  g: any,
  tooltip: any,
  showTooltip: boolean = true,
  showHighlight: boolean = true,
  fireClick: boolean = false
) {
  if (!hasData) {
    return;
  }
  const localCoords = d3Mouse(g.nodes()[0]);
  const hoverX = scales.x.invert(localCoords[0]);
  const selectedData = findSelectedData(data, hoverX);
  if (selectedData) {
    hilightData(selectedData, scales, g);
  }
  const chartBoundingRect = g["_parents"][0].getBoundingClientRect(); // Strangely, g's own width can sometimes be far too wide.
  Tooltip.show(
    Tooltip.html(selectedData),
    tooltip,
    state.tooltipSettings,
    chartBoundingRect
  );

  if (fireClick && selectedData) {
    selectedData.forEach(chartData => {
      if (chartData.onClick) {
        chartData.onClick(hoverX, 0.0); // TODO also pass Y
      }
    });
  }
}

function unhilightDataAndHideTooltip(g: any, tooltip: any) {
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

export default ChartRenderer;
