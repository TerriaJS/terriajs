'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

import getUniqueValues from '../Core/getUniqueValues';
import Scales from './Scales';
import Size from './Size';
import Title from './Title';
import Tooltip from './Tooltip';

// import ChartData from './ChartData';

const defaultMargin = {
    top: 20,
    right: 30,
    bottom: 20,
    left: 0
};
const miniYAxisShift = 30;

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
     * @param  {Boolean} [state.mini] If true, show minified axes.
     * @param  {Number} [state.transitionDuration] Duration of transition effects, in milliseconds.
     * @param  {Object} [state.tooltipSettings] Settings for the tooltip; see Tooltip for the available options.
     */
    create(element, state) {
        const d3Element = d3.select(element);
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
    const margin = defaultValue(state.margin, defaultMargin);
    const allUnits = getUniqueValues(state.data.map(line=>line.units));
    const size = Size.calculate(element, margin, state, state.mini ? 1 : allUnits.length);
    const scales = Scales.calculate(size, state.domain, state.data);
    const data = state.data;
    const transitionDuration = defaultValue(state.transitionDuration, defaultTransitionDuration);
    const hasData = (data.length > 0 && data[0].points.length > 0);

    const d3Element = d3.select(element);
    const svg = d3Element.select('svg')
        .attr('width', state.width)
        .attr('height', state.height);

    const g = d3.select(element).selectAll('.line-chart');
    g.attr('transform', 'translate(' + (margin.left + size.yAxesWidth) + ',' + (margin.top + Title.getHeight(state.titleSettings)) + ')');

    const lines = g.selectAll('.line').data(data, d=>d.id).attr('class', 'line');
    const isFirstLine = (!defined(lines[0][0]));

    const plotArea = d3Element.select('rect.plot-area');
    if (!isFirstLine) {
        plotArea.transition().duration(state.transitionDuration);
    }
    plotArea.attr('width', size.width)
            .attr('height', size.plotHeight);

    // Returns a path function which can be called with an array of points.
    function getPathForUnits(units) {
        return d3.svg.line()
            .x(d=>scales.x(d.x))
            .y(d=>{
                return scales.y[units](d.y);
            })
            .interpolate('basic');
    }

    // Enter.
    lines.enter().append('path')
        .attr('class', 'line')
        .attr('d', line=>getPathForUnits(line.units || Scales.unknownUnits)(line.points))
        .style('fill', 'none')
        .style('opacity', 1e-6)
        .style('stroke', d=>defined(d.color) ? d.color : '');

    // Enter and update.
    lines
        .on('mouseover', fade(g, 0.33))
        .on('mouseout', fade(g, 1))
        .transition().duration(transitionDuration)
        .attr('d', line=>getPathForUnits(line.units || Scales.unknownUnits)(line.points))
        .style('opacity', 1)
        .style('stroke', d=>defined(d.color) ? d.color : '');

    // Exit.
    lines.exit().remove();

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

    // Create the y-axes as needed.
    const yAxisElements = g.select('.y.axes').selectAll('.y.axis').data(allUnits, d=>d);
    yAxisElements.enter().append('g')
        .attr('class', 'y axis')
        .style('opacity', 1e-6)
            .append('g')
            .attr('class', 'colors');
    yAxisElements.exit().remove();

    // Axes.
    const xAxis = d3.svg.axis().orient('bottom');
    const yAxis = d3.svg.axis().ticks(8).orient('left');
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
        .transition().duration(transitionDuration)
        .attr('transform', 'translate(0,' + y0 + ')')
        .style('opacity', 1)
        .call(xAxis);
    // Unfortunately the call(xAxis) doesn't rescale the axis if range has changed when it is in a transition.
    // To handle this case, set transactionDuration to 0 or 1 in your call if the chart width has changed (eg. on resize).
    if (transitionDuration <= 1) {
        g.select('.x.axis').call(xAxis);
    }
    // If mini or no data, hide the ticks, but not the axis, so the x-axis label can still be shown.
    g.select('.x.axis')
        .selectAll('.tick')
        .transition().duration(transitionDuration)
        .style('opacity', (state.mini || !hasData) ? 1e-6 : 1);

    if (defined(state.axisLabel) && defined(state.axisLabel.x)) {
        g.select('.x.axis .label')
            .attr('transform', 'translate(' + (size.width / 2) + ', ' + size.xAxisLabelHeight + ')')
            .attr('text-anchor', 'middle')
            .text(state.axisLabel.x)
            .style('opacity', hasData ? 1 : 1e-6);
    }

    if (state.mini) {
        yAxis.ticks(2)
            .tickSize(0, 0)
            .orient('right');
    }
    yAxisElements
        .attr('transform', (d, i)=>('translate(' + ((state.mini ? -miniYAxisShift : 0) - i * Size.yAxisWidth) + ', 0)'));

    yAxisElements[0].forEach(yAxisElement=>{
        const yAxisD3 = d3.select(yAxisElement);
        const theseUnits = yAxisElement.__data__;
        yAxisD3
            .transition().duration(transitionDuration)
            .style('opacity', hasData ? 1 : 1e-6)
            .call(yAxis.scale(scales.y[theseUnits || Scales.unknownUnits]));
        let colorKeyHtml = '';
        if (allUnits.length > 1) {
            const unitColors = data.filter(line=>(line.units === theseUnits)).map(line=>line.color);
            unitColors.forEach((color, index)=>{
                const y = -15 - index * 5;
                colorKeyHtml += '<path d="M-30 ' + y + ' h 30" style="stroke:' + color + '"/>';
            });
        }
        yAxisD3.select('.colors')
            .html(colorKeyHtml);
    });

    // No data. Show message if no data to show.
    var noData = g.select('.no-data')
        .style('opacity', hasData ? 1e-6 : 1);

    noData.select('text')
        .text(defaultNoDataText)
        .style('text-anchor', 'middle')
        .attr('x', element.offsetWidth / 2 - margin.left)
        .attr('y', (size.height - 24) / 2);
}

// Returns only the data lines which have a selected point on them, with an added "point" property for the selected point.
function findSelectedData(data, x) {
    // For each chart line (pointArray), find the point with the closest x to the mouse.
    const closestXPoints = data.map(line=>line.points.reduce((previous, current)=>
        Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
    ));
    // Of those, find one with the closest x to the mouse.
    const closestXPoint = closestXPoints.reduce((previous, current)=>
        Math.abs(current.x - x) < Math.abs(previous.x - x) ? current : previous
    );
    const nearlyEqualX = (thisPoint)=>(Math.abs(thisPoint.x - closestXPoint.x) < threshold);
    // Only select the chart lines (pointArrays) which have their closest x to the mouse = the overall closest.
    const selectedPoints = closestXPoints.filter(nearlyEqualX);

    const isSelectedArray = closestXPoints.map(nearlyEqualX);
    const selectedData = data.filter((line, i)=>isSelectedArray[i]);
    selectedData.forEach((line, i)=>{line.point = selectedPoints[i];});  // TODO: this adds the property to the original data - bad.
    return selectedData;
}

function hilightData(selectedData, scales, g) {
    const verticalLine = g.select('.selection').selectAll('line').data(selectedData.length > 0 ? [selectedData[0]] : []);
    verticalLine.enter().append('line');
    verticalLine
        .attr('x1', d=>scales.x(d.point.x))
        .attr('y1', d=>scales.y[d.units || Scales.unknownUnits].range()[0])
        .attr('x2', d=>scales.x(d.point.x))
        .attr('y2', d=>scales.y[d.units || Scales.unknownUnits].range()[1]);
    verticalLine.exit().remove();

    const selection = g.select('.selection').selectAll('circle').data(selectedData);
    selection.enter().append('circle');
    selection
        .attr('cx', d=>scales.x(d.point.x))
        .attr('cy', d=>scales.y[d.units || Scales.unknownUnits](d.point.y))
        .style('fill', d=>defined(d.color) ? d.color : '');
    selection.exit().remove();
}

function highlightDataAndShowTooltip(hasData, data, state, scales, g, tooltip) {
    if (!hasData) {
        return;
    }
    const localCoords = d3.mouse(g[0][0]);
    const hoverX = scales.x.invert(localCoords[0]);
    const selectedData = findSelectedData(data, hoverX);
    hilightData(selectedData, scales, g);
    const chartBoundingRect = g[0][0].parentElement.getBoundingClientRect();  // Strangely, g's own width can sometimes be far too wide.
    Tooltip.show(Tooltip.html(selectedData), tooltip, state.tooltipSettings, chartBoundingRect);
}

function unhilightDataAndHideTooltip(g, tooltip) {
    g.select('.selection').selectAll('circle').data([]).exit().remove();
    g.select('.selection').selectAll('line').data([]).exit().remove();
    tooltip.transition().style('opacity', 1e-6);//.style('display', 'none'); // too flashy with display none; but can leave hidden div in front of other elements.
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
