'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

// import ChartData from './ChartData';

const defaultMargin = {
    top: 20,
    right: 30,
    bottom: 20,
    left: 50
};
const miniYAxisShift = 30;
const defaultTooltipOffset = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};

const defaultNoDataText = 'No preview available';

const defaultTransitionDuration = 1000; // milliseconds

const xAxisHeight = 30; // The height of the x-axis itself, ie. the numbering of the ticks.
const xAxisLabelHeight = 25; // The additional height of the x-axis label, eg. "time".
const defaultTitleHeight = 30; // The additional height of the title, which may in fact be the legend.

const defaultTooltipClassName = 'linechart-tooltip';
const defaultTooltipId = 'linechart-tooltip-id';
const defaultTitleClassName = 'linechart-title';
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
     * @param  {Object} [state.titleSettings] Information about the title section.
     * @param  {String} [state.titleSettings.type='string'] May be 'string' or 'legend'.
     * @param  {String} [state.titleSettings.title] For 'string'-type titles, the title.
     * @param  {String} [state.titleSettings.className] The className to use for the title DOM element. Defaults to 'linechart-title'.
     * @param  {Number} [state.titleSettings.height=defaultTitleHeight] The height of the title bar.
     * @param  {Object} [state.domain] The x and y ranges to show.
     * @param  {Number[]} state.domain.x [x-minimum, x-maximum].
     * @param  {Number[]} state.domain.y [y-minimum, y-maximum].
     * @param  {ChartData[]} state.data The data for each line.
     * @param  {Object} [state.axisLabel] Labels for the x and y axes.
     * @param  {String} [state.axisLabel.x] Label for the x axis.
     * @param  {String} [state.axisLabel.y] Label for the y axis.
     * @param  {Boolean} [state.mini] If true, show minified axes.
     * @param  {Number} [state.transitionDuration] Duration of transition effects, in milliseconds.
     * @param  {Object} [state.tooltipSettings] Settings for the tooltip.
     * @param  {String} [state.tooltipSettings.id] The id to use for the tooltip DOM element, defaults to 'linechart-tooltip-id'. Do not change this after creation.
     * @param  {String} [state.tooltipSettings.className] The className to use for the tooltip DOM element, defaults to 'linechart-tooltip'. Do not change this after creation.
     * @param  {String} [state.tooltipSettings.align] One of 'hover' (hover at the mouse position), 'left', 'right', 'prefer-right' (chooses left or right depending on mouse position).
     * @param  {Object} [state.tooltipSettings.offset] An object with top, left and right properties; these properties' meanings depend on the alignment above.
     *                                         With right/left alignment, the offset is relative to the svg.
     */
    create(element, state) {
        const d3Element = d3.select(element);
        d3Element.style('position', 'relative');

        // For a nicely centered title, use css:  .chart-title {left: 0, right: 0, text-align: center;} and maybe {margin: 0 auto;}.
        d3Element.append('div')
            .attr('class', (state.titleSettings && state.titleSettings.className) ? state.titleSettings.className : defaultTitleClassName)
            .style('opacity', 1e-6)
            .style('position', 'absolute');
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
            .attr('class', 'y axis')
            .style('opacity', 1e-6);
        lineChart.append('g')
            .attr('class', 'no-data')
            .append('text');
        lineChart.append('g')
            .attr('class', 'selection');

        // Make the tooltip DOM element, invisible to start.
        // This must go on the body to allow absolute positioning to work.
        if (defined(state.tooltipSettings)) {
            d3.select('body')
                .append('div')
                .attr('id', defaultValue(state.tooltipSettings.id, defaultTooltipId))
                .attr('class', defaultValue(state.tooltipSettings.className, defaultTooltipClassName))
                .style('opacity', 1e-6)
                .style('position', 'absolute')
                .style('display', 'none');
        }

        this.update(element, state);
    },

    update(element, state) {
        render(element, state);
    },

    destroy(element, state) {
        // Remove the tooltip DOM element.
        if (defined(state.tooltipSettings)) {
            const id = defaultValue(state.tooltipSettings.id, defaultTooltipId);
            const tooltipElement = d3.select('#' + id)[0][0];
            if (tooltipElement && tooltipElement.parentElement) {
                tooltipElement.parentElement.removeChild(tooltipElement);
            }
        }
    }

};

function render(element, state) {
    const margin = defaultValue(state.margin, defaultMargin);
    const size = calculateSize(element, margin, state);
    const scales = calculateScales(size, state);
    const data = state.data;
    const transitionDuration = defaultValue(state.transitionDuration, defaultTransitionDuration);
    const hasData = (data.length > 0 && data[0].points.length > 0);

    const d3Element = d3.select(element);
    const svg = d3Element.select('svg')
        .attr('width', state.width)
        .attr('height', state.height);
    d3Element.select('rect.plot-area')
        .attr('width', size.width)
        .attr('height', size.plotHeight);

    const g = d3.select(element).selectAll('.line-chart');
    g.attr('transform', 'translate(' + margin.left + ',' + (margin.top + size.titleHeight) + ')');

    const lines = g.selectAll('.line').data(data, d=>d.id).attr('class', 'line');
    const isFirstLine = (!defined(lines[0][0]));
    const path = d3.svg.line()
        .x((d)=>scales.x(d.x))
        .y((d)=>scales.y(d.y))
        .interpolate('basic');

    // Enter.
    lines.enter().append('path')
        .attr('class', 'line')
        .attr('d', line=>path(line.points))
        .style('fill', 'none')
        .style('opacity', 1e-6)
        .style('stroke', d=>defined(d.color) ? d.color : '')
        .style('stroke-width', 2);

    // Enter and update.
    lines
        .on('mouseover', fade(g, 0.33))
        .on('mouseout', fade(g, 1))
        .transition().duration(transitionDuration)
        .attr('d', line=>path(line.points))
        .style('opacity', 1)
        .style('stroke', d=>defined(d.color) ? d.color : '');

    // Exit.
    lines.exit().remove();

    // Title.
    // The title might be the legend, or a simple string.
    const title = d3Element.select('.' + ((state.titleSettings && state.titleSettings.className) ? state.titleSettings.className : defaultTitleClassName))
        .style('top', margin.top + 'px');
    title
        .transition().duration(transitionDuration)
        .style('opacity', size.titleHeight > 0 ? 1 : 1e-6);
    if (defined(state.titleSettings)) {
        let titleData = data;
        if (state.titleSettings.type === 'string') {
            titleData = [{id: '_string__', name: state.titleSettings.title}];
        }
        const titleComponents = title.selectAll('.title-component').data(titleData, d=>d.id);
        // Enter.
        const addedTitleComponents = titleComponents.enter().append('g')
            .attr('class', 'title-component');
        if (state.titleSettings.type === 'legend') {
            addedTitleComponents.append('span')
                .attr('class', 'color');
        }
        addedTitleComponents.append('span')
            .attr('class', 'name');
        // Enter and update.
        titleComponents.selectAll('.color').style('background-color', d=>d.color);
        titleComponents.selectAll('.name').text(d=>((d.categoryName || '') + ' ' + d.name));
        // Exit.
        titleComponents.exit().remove();
    }

    // Hilighted data and tooltips.
    if (defined(state.tooltipSettings)) {
        const tooltipId = defaultValue(state.tooltipSettings.id, defaultTooltipId);
        const tooltip = d3.select('#' + tooltipId);
        // Whenever the chart updates, remove the hilighted points and tooltips.
        const boundHilightDataAndShowTooltip = highlightDataAndShowTooltip.bind(null, hasData, data, state, scales, g, tooltip);
        unhilightDataAndHideTooltip(g, tooltip);
        svg.on('mouseover', boundHilightDataAndShowTooltip)
            .on('mousemove', boundHilightDataAndShowTooltip)
            .on('click', boundHilightDataAndShowTooltip)
            .on('mouseout', unhilightDataAndHideTooltip.bind(null, g, tooltip));
    }

    // Axes.
    const xAxis = d3.svg.axis().scale(scales.x).orient('bottom');
    let y0 = Math.min(Math.max(scales.y(0), 0), size.plotHeight);
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
    // To handle this case, set transactionDuration to 0 or 1 in your call.
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
            .attr('transform', 'translate(' + (size.width / 2) + ', ' + xAxisLabelHeight + ')')
            .attr('text-anchor', 'middle')
            .text(state.axisLabel.x)
            .style('opacity', hasData ? 1 : 1e-6);
    }

    const yAxis = d3.svg.axis().scale(scales.y).ticks(8).orient('left');
    if (state.mini) {
        yAxis.ticks(2)
            .tickSize(0, 0)
            .orient('right');
    }
    g.select('.y.axis')
        .attr('transform', 'translate(' + (state.mini ? -miniYAxisShift : 0) + ', 0)')
        .transition().duration(transitionDuration)
        .style('opacity', 1)
        .call(yAxis);

    // No data. Show message if no data to show.
    var noData = g.select('.no-data')
        .style('opacity', hasData ? 1e-6 : 1);

    noData.select('text')
        .text(defaultNoDataText)
        .style('text-anchor', 'middle')
        .attr('x', element.offsetWidth / 2 - margin.left)
        .attr('y', (size.height - 24) / 2);
}

function calculateSize(element, margin, state) {
    const titleHeight = defaultValue(defined(state.titleSettings) ? state.titleSettings.height : 0, defaultTitleHeight);
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom - titleHeight;
    const heightMinusXAxisLabelHeight = height - ((defined(state.axisLabel) && defined(state.axisLabel.x)) ? xAxisLabelHeight : 0);
    const plotHeight = heightMinusXAxisLabelHeight - (state.mini ? 0 : xAxisHeight);
    return {
        titleHeight: titleHeight,
        width: width,
        height: height,
        heightMinusXAxisLabelHeight: heightMinusXAxisLabelHeight,
        plotHeight: plotHeight
    };
}

function calculateScales(size, state) {
    let domain = state.domain;
    // pointArrays are only used if domain is undefined, to choose the full domain.
    if (!defined(domain)) {
        const domains = state.data.map(line=>line.getDomain());
        if (!defined(domains)) {
            return;
        }
        domain = {
            x: [d3.min(domains, d=>d.x[0]), d3.max(domains, d=>d.x[1])],
            y: [d3.min(domains, d=>d.y[0]), d3.max(domains, d=>d.y[1])]
        };
        // If the y-domain is positive and could reasonably be displayed to include zero, expand it to do so.
        // (Eg. the range is 5 to 50, do it; if it is 5 to 8, do not. Set the boundary arbitrarily at 5 to 12.5, ie. 1:2.5.)
        if ((domain.y[0] > 0) && (domain.y[0] / domain.y[1] < 0.4)) {
            domain.y[0] = 0;
        }
        // If the y-domain is negative and could reasonably be displayed to include zero, expand it to do so.
        if ((domain.y[1] < 0) && (domain.y[0] / domain.y[1] < 0.4)) {
            domain.y[1] = 0;
        }
    }

    let x;
    if (domain.x[0] instanceof Date) {
        x = d3.time.scale();
    } else {
        x = d3.scale.linear();
    }

    x.range([0, size.width]).domain(domain.x);

    // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive or entirely negative),
    // but not if it is in the middle of the plot (ie. if the y-domain includes zero).

    const yContainsZero = (domain.y[0] < 0 && domain.y[1] > 0);

    if (yContainsZero) {
        const yPositiveOnly = d3.scale.linear()
            .range([size.plotHeight, 0])
            .domain([0, domain.y[1]]);
        if (yPositiveOnly(domain.y[0]) < size.heightMinusXAxisLabelHeight) {
            // There's only a very small negative range. The y-axis is near the bottom of the panel.
            // The x-axis can be xAxisHeight from the bottom, and the negative part of the y-axis fits in the xAxisHeight.
            // We want to use this scale, but we need to expand its range and domain. To do this, just use plotHeight = yPositiveOnly(domain.y[0]).
            size.plotHeight = yPositiveOnly(domain.y[0]);
        } else {
            // There's a big negative range, so the y-axis is not near the bottom of the panel.
            size.plotHeight = size.heightMinusXAxisLabelHeight;
        }
    }

    const y = d3.scale.linear()
        .range([size.plotHeight, 0])
        .domain(domain.y);

    return {x: x, y: y};
}

function makeMouseOverHtml(selectedData) {
    if (selectedData.length === 0) {
        return '';
    }
    let html;
    const x = selectedData[0].point.x; // All the data has the same x.
    // The next line turns [chartData1A, chartData2, chartData1B] into
    // [{key: 'categoryName1', values: [chartData1A, chartData1B]}, {key: 'categoryName2', values: [chartData2]}].
    const groupedData = d3.nest().key(d=>d.categoryName).entries(selectedData);
    html = '<p class="x-value">' + x + '</p>';
    groupedData.forEach(group=>{
        html += '<p class="category-name">' + group.key + '</p>';
        group.values.forEach(line=>{
            html += '<table class="mouseover"><tbody>';
            const styleAttribute = defined(line.color) ? ('style="background-color: ' + line.color + '" ') : '';
            html += '<tr>';
            html += '<td><span class="color" ' + styleAttribute + '></span><span class="name">' + line.name + '</span></td>';
            html += '<td class="value">' + line.point.y + ' <span class="units">' + (line.units || '') + '</span></td>';
            html += '</tr>';
            html += '</tbody></table>';
        });
    });
    return html;
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
    const verticalLine = g.select('.selection').selectAll('line').data(selectedData.length > 0 ? [selectedData[0].point] : []);
    verticalLine.enter().append('line');
    verticalLine
        .attr('x1', d=>scales.x(d.x))
        .attr('y1', d=>scales.y.range()[0])
        .attr('x2', d=>scales.x(d.x))
        .attr('y2', d=>scales.y.range()[1]);
    verticalLine.exit().remove();

    const selection = g.select('.selection').selectAll('circle').data(selectedData);
    selection.enter().append('circle');
    selection
        .attr('cx', d=>scales.x(d.point.x))
        .attr('cy', d=>scales.y(d.point.y))
        .style('fill', d=>defined(d.color) ? d.color : '');
    selection.exit().remove();
}

function showTooltip(html, tooltipElement, tooltipSettings, boundingRect) {
    tooltipElement
        .html(html)
        .style('opacity', 1e-6)
        .style('display', 'block')
        .transition()
            .style('opacity', 1);

    const tooltipHeight = +tooltipElement[0][0].offsetHeight;
    const tooltipWidth = +tooltipElement[0][0].offsetWidth;
    const tooltipOffset = defaultValue(tooltipSettings.offset, defaultTooltipOffset);
    let top, left;

    switch (tooltipSettings.align) {
        case 'left':
            top = +boundingRect.top + tooltipOffset.top;
            left = +boundingRect.left + tooltipOffset.left;
            break;
        case 'right':
            top = +boundingRect.top + tooltipOffset.top;
            left = +boundingRect.right - tooltipOffset.right - tooltipWidth;
            break;
        case 'prefer-right':
            // Only show on the left if we would be under the tooltip on the right, but not on the left.
            top = +boundingRect.top + tooltipOffset.top;
            // console.log(boundingRect.top);  // Occasionally the top jerks around a little?
            left = +boundingRect.right - tooltipOffset.right - tooltipWidth;
            const rightEdgeWhenPositionedLeft = +boundingRect.left + tooltipOffset.left + tooltipWidth;
            if ((d3.event.pageX >= left) && (d3.event.pageX > rightEdgeWhenPositionedLeft)) {
                left = +boundingRect.left + tooltipOffset.left;
            }
            break;
        case 'hover':
            top = d3.event.pageY - tooltipOffset.top;
            left = d3.event.pageX + (-tooltipWidth - tooltipOffset.left);
            break;
        default:  // Same as hover. Would prefer not to have the break above, but lint requires it.
            top = d3.event.pageY - tooltipOffset.top;
            left = d3.event.pageX + (-tooltipWidth - tooltipOffset.left);
    }

    // Make sure the bottom of the tooltip never goes off the bottom of the screen.
    top = Math.min(top, Math.max(5, window.innerHeight - tooltipHeight - tooltipOffset.bottom));
    tooltipElement
        .style('left', left + 'px')
        .style('top', top + 'px');
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
    showTooltip(makeMouseOverHtml(selectedData), tooltip, state.tooltipSettings, chartBoundingRect);
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
