'use strict';

import {mouse as d3Mouse, select as d3Select} from 'd3-selection';
import {axisBottom as d3AxisBottom, axisLeft as d3AxisLeft} from 'd3-axis';
import {transition as d3Transition} from 'd3-transition';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

import getUniqueValues from '../Core/getUniqueValues';
import Scales from './Scales';
import Size from './Size';
import Title from './Title';
import Tooltip from './Tooltip';
import initialiseChartTypes from './initialiseChartTypes';

import d3Sync from './d3Sync';

//const yAxisLabelWidth = 21;

const defaultMargin = {
    top: 20,
    right: 30,
    bottom: 20,
    left: 0
};

const yAxisLabelWidth = 21;

const defaultNoDataText = 'No preview available';

const defaultTransitionDuration = 1000; // milliseconds

const threshold = 1e-8; // Threshold for 'equal' x-values during mouseover.

class ChartRenderer {

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
        
        d3Container.style('position', 'relative');

        Title.create(d3Container, state.titleSettings);

        const svg = d3Container.append('svg')
            .attr('class', 'd3')
            .attr('width', state.width)
            .attr('height', state.height);

        const chart = svg.append('g')
            .attr('class', 'base-chart');

        chart.append('rect')
            .attr('class', 'plot-area')
            .attr('x', '0')
            .attr('y', '0');

        chart.append('g')
            .attr('class', 'x axis')
            .append('text')
            .attr('class', 'label');

        chart.append('g')
            .attr('class', 'y-axis');
            
        chart.append('g')
            .attr('class', 'content');

        chart.append('g')
            .attr('class', 'no-data')
            .append('text');

        chart.append('g')
            .attr('class', 'selection');

        Tooltip.create(state.tooltipSettings);

        this.update(container, state);
    }

    static update(container, state) {
        this.render(container, state);
    }

    static destroy(container, state) {
        Tooltip.destroy(state.tooltipSettings);
    }
    
    static render(container, state) {
        if (!defined(state.data)) {
            return;
        }

        initialiseChartTypes(state);
        
        const margin = defaultValue(state.margin, defaultMargin);
        const units = getUniqueValues(state.data.map(data => data.units));
        const size = Size.calculate(container, margin, state, state.mini ? 1 : units.length);
        const scales = Scales.calculate(size, state.domain, state.data, this.getXpadding(state));
        
        const transitionDuration = defaultValue(state.transitionDuration, defaultTransitionDuration);

        const d3Container = d3Select(container);

        // Update SVG
        const chartSVGContainer = d3Container.select('svg')
            .attr('width', state.width)
            .attr('height', state.height)
            .style('user-select', 'none')
            .style('cursor', 'default');

        // Update Plot Area
        const plotArea = d3Container.select('rect.plot-area');
        plotArea.attr('width', size.width)
            .attr('height', size.plotHeight);

        // Update chart area
        size.yChartOffset = margin.top + Title.getHeight(state.titleSettings);
        const chartTransform = 'translate(' + (margin.left + size.yAxesWidth) + ',' + (size.yChartOffset) + ')';
        const chartTransition = d3Transition().duration(transitionDuration);
        
        const chart = d3Select(container).selectAll('.base-chart').attr('transform', chartTransform);
        const chartPlotContainer = chart.select('.content');

        // Title.
        Title.enterUpdateAndExit(d3Container, state.titleSettings, margin, state, transitionDuration);

        const renderContext = {
            // helpful baseline input
            container,
            state,

            // helpful constraints
            size,
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

        this.renderChart(renderContext);

        this.renderToolTip(renderContext);

        this.renderHighlight(renderContext);

        // No data. Show message if no data to show.
        this.renderNoData(renderContext);

        // Axes.
        if (defined(scales)) {
            this.renderAxis(renderContext);
        }
    }
    
    static getXpadding(state) {
        return Math.max.apply(Math, state.data.map(cd => cd.renderer.getXpadding(cd, state)));
    }
    /**
     * Render each of the dataseries within a plot container.
     * @param {*} renderContext 
     */
    static renderChart(renderContext) {
        d3Sync(renderContext.chartPlotContainer, renderContext.state.data, 'g', chart => {
            chart.each(function (chartData, index, charts) {
                const chart = d3Select(this)
                    .attr('class', 'render')
                    .attr('id', chartData.id);
                chartData.renderer.render(chart, chartData, renderContext);
            });
        });
    }
    /**
     * Add click and mouseover handlers to highlight hovered data, and show tooltips.
     * @param {} renderContext 
     */
    static renderToolTip(renderContext)
    {
        const {chartSVGContainer, state, scales, chart} = renderContext;
        const hasData = (state.data.length > 0 && state.data[0].points.length > 0);
        // Hilighted data and tooltips.
        if (defined(state.tooltipSettings)) {
            const tooltip = Tooltip.select(state.tooltipSettings);
            // Whenever the chart updates, remove the hilighted points and tooltips.
            const boundHilightDataAndShowTooltip = highlightDataAndShowTooltip.bind(null, hasData, state.data, state, scales, chart, tooltip);
            unhilightDataAndHideTooltip(chart, tooltip);
            chartSVGContainer.on('mouseover', boundHilightDataAndShowTooltip)
                .on('mousemove', boundHilightDataAndShowTooltip)
                .on('click', boundHilightDataAndShowTooltip)
                .on('mouseout', unhilightDataAndHideTooltip.bind(null, chart, tooltip));
        }
    }
    
    static renderHighlight(renderContext)
    {
        const {state, scales, chart} = renderContext;
        // Hilighted data and tooltips.
        if (defined(state.highlightX)) {
            const selectedData = findSelectedData(state.data, state.highlightX);
            hilightData(selectedData, scales, chart);
        }
    }
    
    static renderNoData(renderContext)
    {
        const {container, state, size, margin, chart} = renderContext;
        const hasData = state.data.length > 0 && state.data[0].points.length > 0;
        
        const noData = chart.select('.no-data')
            .style('opacity', hasData ? 1e-6 : 1);

        noData.select('text')
            .text(defaultNoDataText)
            .style('text-anchor', 'middle')
            .attr('x', container.offsetWidth / 2 - margin.left - size.yAxesWidth)
            .attr('y', (size.height - 24) / 2);
    }
    
    /**
     * Draw X and Y axes, tick marks and labels.
     * @param {Object} renderContext 
     */
    static renderAxis(renderContext)
    {
        const {state, size, scales, units, chart, chartTransition} = renderContext;

        // Create the y-axis as needed.
        // -----------------
        // y axis group
        d3Sync(chart.select('.y-axis'), units, 'g', (axis, axes, enter) => {
            // individual y axis groups
            axis = axis
                .attr('class', 'y axis')
                .attr('id', unit => `${unit}`);

            // subelement groups
            d3Sync(axis, ['ticks', 'colors', 'units-label-shadow-group', 'units-label-group'], 'g', sub => {
                sub.attr('class', x => x);

                // for unit classed groups, rotate and position text appropriately for showing unit label
                sub.each(function(item) {
                    if (item.match(/^units/)) {
                        const node = d3Select(this);
                        node.attr('transform', `translate(${-Size.yAxisWidth + yAxisLabelWidth}, ${size.yChartOffset + 10})rotate(270)`);
                        d3Sync(node, [''], 'text', text => text.attr('class', 'units-label'));
                    }
                });
            });
        });
        
        // for each y axis
        chart.selectAll('.y.axis').nodes().forEach((node, yNodeIndex) => {
            const yNode = d3Select(node);
            
            // move subsequent axis further left
            yNode.attr('transform', `translate(${yNodeIndex * -Size.yAxisWidth},0)`);
            
            const unit = units[yNodeIndex];
            const scale = scales.y[unit];

            // build axis object
            let tickSizeInner = (defined(state.grid) && state.grid.y) ? -size.width : 3;
            
            if (yNodeIndex > 0) {
                tickSizeInner += yNodeIndex * -Size.yAxisWidth;
            }

            const yAxis = d3AxisLeft()
                .tickSizeOuter((units.length > 1) ? 0 : 3)
                .tickSizeInner(tickSizeInner)
                .scale(scale);

            if (state.mini) {
                yAxis.tickSize(0, 0).tickValues(scale.domain());
            } else {
                const numYTicks = Math.min(6, Math.floor(size.plotHeight / 30) + 1);
                yAxis.tickValues(Scales.truncatedTickValues(scale, numYTicks));
            }

            // draw axis
            const axis = yNode
                .selectAll('.ticks')
                .transition(chartTransition)
                .call(yAxis);

            // color axis with the color of first dataset if there are multiple units
            if (units.length > 1) {
                const dataset = state.data.filter(data => data.units === unit)[0];
                axis.selectAll('line').style('stroke', dataset.color || 'white').style('opacity', '0.25');
                axis.selectAll('text').style('fill', dataset.color || 'white');
                axis.selectAll('path.domain').style('stroke', dataset.color || 'white');
            } else {
                axis.selectAll('line').style('stroke', 'white').style('opacity', '0.25');
                axis.selectAll('text').style('fill', 'white');
                if (!state.mini) {
                    axis.selectAll('path.domain').style('stroke', 'white');
                }
            }
            
            yNode.selectAll('.units-label').text(unit || '');
            
        });

        // Create the x-axis as needed.
        // -----------------
        
        const y0 = state.mini ? size.plotHeight : Math.min(Math.max(scales.y[units[0]](0), 0), size.plotHeight);
        
        // An extra calculation to decide whether we want the last automatically-generated tick value.
        const xTickValues = Scales.truncatedTickValues(scales.x, Math.min(12, Math.floor(size.width / 150) + 1));
        const xAxis = d3AxisBottom()
            .tickValues(xTickValues);
        
        if (defined(state.grid) && state.grid.x) {
            // Note this only extends up; if the axis is not at the bottom, we need to translate the ticks down too.
            xAxis.tickSizeInner(-size.plotHeight);
        }
        
        xAxis.scale(scales.x);
        
        chart.select('.x.axis')
            .attr('transform', 'translate(0,' + y0 + ')')
            .call(xAxis);

        if (defined(state.grid) && state.grid.x) {
            // Recall the x-axis-grid lines only extended up; we need to translate the ticks down to the bottom of the plot.
            chart.selectAll('.x.axis line').attr('transform', 'translate(0,' + (size.plotHeight - y0) + ')');
        }
        // If mini with label, or no data: hide the ticks, but not the axis, so the x-axis label can still be shown.
        var hasXLabel = defined(state.axisLabel) && defined(state.axisLabel.x);
        chart.select('.x.axis')
            .selectAll('.tick')
            .style('opacity', 0)
            .transition(chartTransition)
            .style('opacity', (state.mini && hasXLabel) ? 1e-6 : 1)
            .selectAll('text')
            .style('fill', 'white');

        if (hasXLabel) {
            chart.select('.x.axis .label')
                .style('text-anchor', 'middle')
                .text(state.axisLabel.x)
                // Translate the x-axis-label to the bottom of the plot, even if the x-axis itself is in the middle or the top.
                .attr('transform', 'translate(' + (size.width / 2) + ', ' + (size.height - y0) + ')');
        }
    }
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

module.exports = ChartRenderer;
