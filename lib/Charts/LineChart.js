'use strict';

import {mouse as d3Mouse, select as d3Select} from 'd3-selection';
import {line as d3Line} from 'd3-shape';
import {axisBottom as d3AxisBottom, axisLeft as d3AxisLeft} from 'd3-axis';
import {transition as d3Transition} from 'd3-transition';
import uniq from 'lodash.uniq';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

import Scales from './Scales';
import Size from './Size';
import Title from './Title';
import Tooltip from './Tooltip';

// import ChartData from './ChartData';

const yAxisLabelWidth = 21;

const defaultMargin = {
    top: 20,
    right: 30,
    bottom: 20,
    left: 0
};

const defaultNoDataText = 'No preview available';

const defaultTransitionDuration = 1000; // milliseconds

const threshold = 1e-8; // Threshold for 'equal' x-values during mouseover.

const LineChart = {

    /**
     * Create a Line Chart.
     * @param  {DOMElement} element The DOM element in which to place the chart.
     * @param  {Object} state The state of the chart.
     * @param  {Number} state.width The width of the svg element.
     * @param  {Number} state.height The height of the svg element.
     * @param  {Object} [state.margin] The chart's margin.
     * @param  {Number} state.margin.top The chart's top margin.
     * @param  {Number} state.margin.right The chart's right margin.
     * @param  {Number} state.margin.bottom The chart's bottom margin.
     * @param  {Number} state.margin.left The chart's left margin.
     * @param  {Object} [state.titleSettings] Information about the title section; see Title for the available options.
     * @param  {Object} [state.domain] The x and y ranges to show; see Scales for the format.
     * @param  {ChartData[]} state.data The data for each line.
     * @param  {Object} [state.axisLabel] Labels for the x and y axes.
     * @param  {String} [state.axisLabel.x] Label for the x axis.
     * @param  {String} [state.axisLabel.y] Label for the y axis.
     * @param  {Number} [state.xAxisHeight] Height of the x-axis; used in Size.
     * @param  {Number} [state.xAxisLabelHeight] Height of the x-axis label; used in Size.
     * @param  {Object} [state.grid] Grids for the x and y axes.
     * @param  {Boolean} [state.grid.x] Do you want vertical gridlines?
     * @param  {Boolean} [state.grid.y] Do you want horizontal gridlines?
     * @param  {Boolean} [state.mini] If true, show minified axes.
     * @param  {Number} [state.transitionDuration] Duration of transition effects, in milliseconds.
     * @param  {Object} [state.tooltipSettings] Settings for the tooltip; see Tooltip for the available options.
     * @param  {Number|String} [state.highlightX] Force a particular x-position to be highlighted.
     */
    create(element, state) {
        if (!element) {
            return;
        }
        const d3Element = d3Select(element);
        d3Element.style('position', 'relative');

        Title.create(d3Element, state.titleSettings);

        const svg = d3Element.append('svg')
            .attr('class', 'd3')
            .attr('width', state.width)
            .attr('height', state.height);

        const lineChart = svg.append('g')
            .attr('class', 'line-chart');

        lineChart.append('rect')
            .attr('class', 'plot-area')
            .attr('x', '0')
            .attr('y', '0');
        lineChart.append('g')
            .attr('class', 'x axis')
            .style('opacity', 1e-6)
            .append('text')
            .attr('class', 'label');
        lineChart.append('g')
            .attr('class', 'y axes');
        lineChart.append('g')
            .attr('class', 'no-data')
            .append('text');
        lineChart.append('g')
            .attr('class', 'selection');

        Tooltip.create(state.tooltipSettings);

        this.update(element, state);
    },

    update(element, state) {
        render(element, state);
    },

    destroy(element, state) {
        Tooltip.destroy(state.tooltipSettings);
    }
};

function render(element, state) {
    if (!defined(state.data)) {
        return;
    }
    const margin = defaultValue(state.margin, defaultMargin);
    const allUnits = uniq(state.data.map(line => line.units));
    const size = Size.calculate(element, margin, state, state.mini ? 1 : allUnits.length);
    const scales = Scales.calculate(size, state.domain, state.data);
    const data = state.data;
    const transitionDuration = defaultValue(state.transitionDuration, defaultTransitionDuration);
    // The last condition in hasData checks that at least one y-value of one chart is defined.
    const hasData = (data.length > 0 && data[0].points.length > 0 && data.some(d=>d.points.some(p=>defined(p.y))));

    const d3Element = d3Select(element);
    const svg = d3Element.select('svg')
        .attr('width', state.width)
        .attr('height', state.height);

    const g = d3Select(element).selectAll('.line-chart');

    const t = d3Transition().duration(transitionDuration);

    // Some axis animations need to be a little different if this is the first time we are showing the graph.
    // Assume it's the first time if we have no lines yet.
    const lines = g.selectAll('.line').data(data, d => d.id).attr('class', 'line');
    const isFirstLine = (!defined(lines.nodes()[0]));
    const gTransform = 'translate(' + (margin.left + size.yAxesWidth) + ',' + (margin.top + Title.getHeight(state.titleSettings)) + ')';
    if (isFirstLine) {
        g.attr('transform', gTransform);
    } else {
        g.transition(t)
            .attr('transform', gTransform);
    }

    const plotArea = d3Element.select('rect.plot-area');
    plotArea.attr('width', size.width)
        .attr('height', size.plotHeight);

    // Returns a path function which can be called with an array of points.
    function getPathForUnits(units) {
        return d3Line()
            // .curve(d3Shape.curveBasis)
            .x(d => scales.x(d.x))
            .y(d => scales.y[units](d.y));
            // NOTE: it was originally 'basic', which is not a interpolation
    }

    // Enter.
    // https://github.com/d3/d3/blob/master/CHANGES.md#selections-d3-selection
    // If there are undefined or null y-values, just ignore them. This works well for initial and final undefined values,
    // and simply interpolates over intermediate ones. This may not be what we want.
    lines.enter().append('path')
        .attr('class', 'line')
        .attr('d', line => getPathForUnits(line.units || Scales.unknownUnits)(line.points.filter(point => defined(point.y))))
        .style('fill', 'none')
        .style('opacity', 1e-6)
        .transition(t)
        .style('opacity', 1)
        .style('stroke', d => defined(d.color) ? d.color : '');

    // Mouse event.
    lines
        .on('mouseover', fade(g, 0.33))
        .on('mouseout', fade(g, 1));

    // Update.
    // Same approach to undefined or null y-values as enter.
    lines
        .transition(t)
        .attr('d', line => getPathForUnits(line.units || Scales.unknownUnits)(line.points.filter(point => defined(point.y))))
        .style('opacity', 1)
        .style('stroke', d => defined(d.color) ? d.color : '');

    // Exit.
    lines.exit()
        .transition(t)
        .style('opacity', 1e-6)
        .remove();

    // Title.
    Title.enterUpdateAndExit(d3Element, state.titleSettings, margin, data, transitionDuration);

    // Hilighted data and tooltips.
    if (defined(state.tooltipSettings)) {
        const tooltip = Tooltip.select(state.tooltipSettings);
        // Whenever the chart updates, remove the hilighted points and tooltips.
        const boundHilightDataAndShowTooltip = highlightDataAndShowTooltip.bind(null, hasData, data, state, scales, g, tooltip);
        unhilightDataAndHideTooltip(g, tooltip);
        svg.on('mouseover', boundHilightDataAndShowTooltip)
            .on('mousemove', boundHilightDataAndShowTooltip)
            .on('click', boundHilightDataAndShowTooltip)
            .on('mouseout', unhilightDataAndHideTooltip.bind(null, g, tooltip));
    }

    if (defined(state.highlightX)) {
        const selectedData = findSelectedData(data, state.highlightX);
        hilightData(selectedData, scales, g);
    }

    // Create the y-axes as needed.
    const yAxisElements = g.select('.y.axes').selectAll('.y.axis').data(allUnits, d => d);
    const newYAxisElements = yAxisElements.enter().append('g')
        .attr('class', 'y axis')
        .style('opacity', 1e-6);

    newYAxisElements.append('g')
        .attr('class', 'ticks');
    newYAxisElements.append('g')
        .attr('class', 'colors');
    newYAxisElements.append('g')
        .attr('class', 'units-label-shadow-group') // This doesn't yet do what we want, because it comes before the ticks.
        .attr('transform', 'translate(' + -(Size.yAxisWidth - yAxisLabelWidth) + ',6)rotate(270)')
            .append('text')
            .attr('class', 'units-label-shadow')
            .style('text-anchor', 'end');
    newYAxisElements.append('g')
        .attr('class', 'units-label-group')
        .attr('transform', 'translate(' + -(Size.yAxisWidth - yAxisLabelWidth) + ',6)rotate(270)')
            .append('text')
            .attr('class', 'units-label')
            .style('text-anchor', 'end');
    yAxisElements.exit().remove();

    // No data. Show message if no data to show.
    var noData = g.select('.no-data')
        .style('opacity', hasData ? 1e-6 : 1);

    noData.select('text')
        .text(defaultNoDataText)
        .style('text-anchor', 'middle')
        .attr('x', element.offsetWidth / 2 - margin.left - size.yAxesWidth)
        .attr('y', (size.height - 24) / 2);

    // Axes.
    if (!defined(scales)) {
        return;
    }

    // An extra calculation to decide whether we want the last automatically-generated tick value.
    const xTickValues = Scales.truncatedTickValues(scales.x, Math.min(12, Math.floor(size.width / 150) + 1));
    const xAxis = d3AxisBottom()
        .tickValues(xTickValues);
    if (defined(state.grid) && state.grid.x) {
        // Note this only extends up; if the axis is not at the bottom, we need to translate the ticks down too.
        xAxis.tickSizeInner(-size.plotHeight);
    }

    const yAxis = d3AxisLeft()
        .tickSizeOuter((allUnits.length > 1) ? 0 : 3);
    let y0 = 0;
    let mainYScale;
    if (defined(scales)) {
        mainYScale = scales.y[allUnits[0] || Scales.unknownUnits];
        xAxis.scale(scales.x);

        y0 = Math.min(Math.max(mainYScale(0), 0), size.plotHeight);
    }
    // Mini charts have the x-axis label at the bottom, regardless of where the x-axis would actually be.
    if (state.mini) {
        y0 = size.plotHeight;
    }
    // If this is the first line, start the x-axis in the right place straight away.
    if (isFirstLine) {
        g.select('.x.axis').attr('transform', 'translate(0,' + y0 + ')');
    }

    g.select('.x.axis')
        .transition(t)
        .attr('transform', 'translate(0,' + y0 + ')')
        .style('opacity', 1)
        .call(xAxis);
    if (defined(state.grid) && state.grid.x) {
        // Recall the x-axis-grid lines only extended up; we need to translate the ticks down to the bottom of the plot.
        g.selectAll('.x.axis line').attr('transform', 'translate(0,' + (size.plotHeight - y0) + ')');
    }
    // If mini with label, or no data: hide the ticks, but not the axis, so the x-axis label can still be shown.
    var hasXLabel = defined(state.axisLabel) && defined(state.axisLabel.x);
    g.select('.x.axis')
        .selectAll('.tick')
        .transition(t)
        .style('opacity', ((state.mini && hasXLabel) || !hasData) ? 1e-6 : 1);

    if (hasXLabel) {
        g.select('.x.axis .label')
            .style('text-anchor', 'middle')
            .text(state.axisLabel.x)
            .style('opacity', hasData ? 1 : 1e-6)
                // Translate the x-axis-label to the bottom of the plot, even if the x-axis itself is in the middle or the top.
                .attr('transform', 'translate(' + (size.width / 2) + ', ' + (size.height - y0) + ')');
    }

    if (state.mini) {
        yAxis.tickSize(0, 0);
    }
    const yAxisElementsElements = g.select('.y.axes').selectAll('.y.axis');

    yAxisElementsElements
        .transition(t)
        .attr('transform', (d, i) => ('translate(' + (- i * Size.yAxisWidth) + ', 0)'));

    yAxisElementsElements.nodes().forEach(yAxisElement => {
        const yAxisD3 = d3Select(yAxisElement);
        const theseUnits = yAxisElement.__data__;
        const thisYScale = scales.y[theseUnits || Scales.unknownUnits];
        // Only show the horizontal grid lines for the main y-axis, or it gets too confusing.
        const tickSizeInner = (thisYScale === mainYScale && defined(state.grid) && state.grid.y) ? -size.width : 3;
        let yTickValues;
        if (state.mini) {
            yTickValues = thisYScale.domain();
        } else {
            const numYTicks = state.mini ? 2 : Math.min(6, Math.floor(size.plotHeight / 30) + 1);
            yTickValues = Scales.truncatedTickValues(thisYScale, numYTicks);
        }
        yAxis
            .tickValues(yTickValues)
            .tickSizeInner(tickSizeInner)
            .scale(thisYScale);
        yAxisD3
            .transition(t)
            .style('opacity', hasData ? 1 : 1e-6)
            .select('.ticks')
                .call(yAxis);
        let colorKeyHtml = '';
        if (allUnits.length > 1) {
            const unitColors = data.filter(line=>(line.units === theseUnits)).map(line=>line.color);
            unitColors.forEach((color, index)=>{
                const y = -1 - index * 4;
                colorKeyHtml += '<path d="M-30 ' + y + ' h 30" style="stroke:' + color + '"/>';
            });
        }
        yAxisD3.select('.colors').html(colorKeyHtml);
        yAxisD3.select('.units-label').text(theseUnits || '');
        yAxisD3.select('.units-label-shadow').text(theseUnits || '');
    });
}

// Returns only the data lines which have a selected point on them, with an added "point" property for the selected point.
function findSelectedData(data, x) {
    // For each chart line (pointArray), find the point with the closest x to the mouse.
    const closestXPoints = data.map(line => line.points.reduce((previous, current) =>
        Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
    ));
    // Of those, find one with the closest x to the mouse.
    const closestXPoint = closestXPoints.reduce((previous, current) =>
        Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
    );
    const nearlyEqualX = (thisPoint) => (Math.abs(thisPoint.x - closestXPoint.x) < threshold);
    // Only select the chart lines (pointArrays) which have their closest x to the mouse = the overall closest.
    const selectedPoints = closestXPoints.filter(nearlyEqualX);

    const isSelectedArray = closestXPoints.map(nearlyEqualX);
    const selectedData = data.filter((line, i) => isSelectedArray[i]);
    selectedData.forEach((line, i) => {line.point = selectedPoints[i];});  // TODO: this adds the property to the original data - bad.
    return selectedData;
}

function hilightData(selectedData, scales, g) {
    const verticalLine = g.select('.selection').selectAll('line').data(selectedData.length > 0 ? [selectedData[0]] : []);
    verticalLine.enter().append('line')
        .merge(verticalLine) // New pattern in d3 v4.0 https://github.com/d3/d3/blob/master/CHANGES.md#selections-d3-selection
        .attr('x1', d => scales.x(d.point.x))
        .attr('y1', d => scales.y[d.units || Scales.unknownUnits].range()[0])
        .attr('x2', d => scales.x(d.point.x))
        .attr('y2', d => scales.y[d.units || Scales.unknownUnits].range()[1]);
    verticalLine.exit().remove();

    const selection = g.select('.selection').selectAll('circle').data(selectedData);
    selection.enter().append('circle')
        .merge(selection)
        .attr('cx', d => scales.x(d.point.x))
        .attr('cy', d => scales.y[d.units || Scales.unknownUnits](d.point.y))
        .style('fill', d => defined(d.color) ? d.color : '');
    selection.exit().remove();
}

function highlightDataAndShowTooltip(hasData, data, state, scales, g, tooltip) {
    if (!hasData) {
        return;
    }
    const localCoords = d3Mouse(g.nodes()[0]);
    const hoverX = scales.x.invert(localCoords[0]);
    const selectedData = findSelectedData(data, hoverX);
    hilightData(selectedData, scales, g);
    const chartBoundingRect = g['_parents'][0].getBoundingClientRect();  // Strangely, g's own width can sometimes be far too wide.
    Tooltip.show(Tooltip.html(selectedData), tooltip, state.tooltipSettings, chartBoundingRect);
}

function unhilightDataAndHideTooltip(g, tooltip) {
    g.select('.selection').selectAll('circle').data([]).exit().remove();
    g.select('.selection').selectAll('line').data([]).exit().remove();
    Tooltip.hide(tooltip);
}

// Returns an event handler for fading chart lines in or out.
function fade(d3Element, opacity) {
    return function(selectedLine) {
        d3Element.selectAll('.line')
            .filter(function(thisLine) {
                return thisLine.id !== selectedLine.id;
            })
            .transition()
            .style('opacity', opacity);
    };
}



module.exports = LineChart;
