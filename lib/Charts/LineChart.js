'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const defaultMargin = {
    top: 20,
    right: 30,
    bottom: 20,
    left: 50
};
const miniYAxisShift = 30;
const tooltipOffset = {
    top: 10,
    left: 10
};

const defaultTransitionDuration = 1000; // milliseconds
const xAxisHeight = 30; // the height of the x-axis itself, ie. the numbering of the ticks.
const xAxisLabelHeight = 25; // the additional height of the x-axis label, eg. "time".

let tooltip;
const threshold = 1e-8; // Threshold for 'equal' x-values during mouseover.

const LineChart = {

    /**
     * Create a Line Chart.
     * @param  {DOMElement} element The DOM element in which to place the chart.
     * @param  {Object} state The state of the chart.
     * @param  {String} tooltipClassName The class name to use for the tooltip DOM element. If falsy, no tooltip element is created.
     * @param  {Number} state.width The width of the svg element.
     * @param  {Number} state.height The height of the svg element.
     * @param  {Object} [state.margin] The chart's margin.
     * @param  {Number} state.margin.top The chart's top margin.
     * @param  {Number} state.margin.right The chart's right margin.
     * @param  {Number} state.margin.bottom The chart's bottom margin.
     * @param  {Number} state.margin.left The chart's left margin.
     * @param  {Object} [state.domain] The x and y ranges to show.
     * @param  {Number[]} state.domain.x [x-minimum, x-maximum].
     * @param  {Number[]} state.domain.y [y-minimum, y-maximum].
     * @param  {Array[]} state.data The array of arrays of data. Each subarray contains elements {x: X, y: Y}.
     *                              Further, each subarray must have a unique id property, and may have also have:
     *                              itemName, columnName and units properties. These are used in the legend only.
     * @param  {String[]} [state.colors] An array of css color strings, of the same length as data.
     * @param  {Object} [state.axisLabel] Labels for the x and y axes.
     * @param  {String} [state.axisLabel.x] Label for the x axis.
     * @param  {String} [state.axisLabel.y] Label for the y axis.
     * @param  {Boolean} [state.mini] If true, show minified axes.
     * @param  {Number} [state.transitionDuration] Duration of transition effects, in milliseconds.
     */
    create(element, state, tooltipClassName) {
        const svg = d3.select(element).append('svg')
            .attr('class', 'd3')
            .attr('width', state.width)
            .attr('height', state.height);

        const lineChart = svg.append('g')
            .attr('class', 'line-chart');

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
        if (tooltipClassName) {
            tooltip = d3.select('body').append('div').attr('class', tooltipClassName).style('opacity', 1e-6).style('position', 'absolute').style('display', 'none');
        }


        this.update(element, state);
    },

    update(element, state) {
        render(element, state);
    },

    destroy(element) {
        // Remove the tooltip DOM element.
        if (tooltip && tooltip[0][0].parentElement) {
            tooltip[0][0].parentElement.removeChild(tooltip[0][0]);
        }
    }

};

// Returns an event handler for fading chart lines in or out.
function fade(d3Element, opacity) {
    return function(g, i) {
        d3Element.selectAll('.line')
            .filter(function(d, j) { return j !== i; })
            .transition()
            .style('opacity', opacity);
    };
}

function render(element, state) {
    const margin = defaultValue(state.margin, defaultMargin);
    const size = calculateSize(element, margin, state);
    const scales = calculateScales(size, state);
    const data = state.data;
    const colors = state.colors;
    const transitionDuration = defaultValue(state.transitionDuration, defaultTransitionDuration);
    const hasData = (data.length > 0 && data[0].length > 0);

    const svg = d3.select(element).select('svg')
        .attr('width', state.width)
        .attr('height', state.height);

    const g = d3.select(element).selectAll('.line-chart');
    g.attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

    const lines = g.selectAll('.line').data(data, d=>d.id).attr('class', 'line');
    const isFirstLine = (!defined(lines[0][0]));
    const path = d3.svg.line()
        .x((d)=>scales.x(d.x))
        .y((d)=>scales.y(d.y))
        .interpolate('basic');

    // Enter.
    lines.enter().append('path')
        .attr('class', 'line')
        .attr('d', path)
        .style('fill', 'none')
        .style('opacity', 1e-6)
        .style('stroke', (d, i)=>defined(colors) ? colors[i] : '')
        .style('stroke-width', 2);

    // Enter and update.
    lines
        .on('mouseover', function(d, i) { return fade(g, 0.5)(d, i); })
        .on('mouseout', function(d, i) { return fade(g, 1)(d, i); })
        .transition().duration(transitionDuration)
        .attr('d', path)
        .style('opacity', 1)
        .style('stroke', (d, i)=>defined(colors) ? colors[i] : '');

    // Exit.
    lines.exit().remove();

    function makeMouseOverHtml(mini, selectedPoints, selectedData, selectedColors) {
        if (selectedPoints.length === 0) {
            return '';
        }
        let html;
        const x = selectedPoints[0].x; // All the data has the same x.
        if (mini) {
            if (selectedPoints.length === 1) {
                html = '<table class="mouseover"><tbody>';
                html += '<tr>';
                html += '<td>';
                if (x instanceof Date) {
                    html += x.toLocaleTimeString();  // TODO: not general enough.
                } else {
                    html += x;
                }
                html += '</td>';
                html += '<td>' + selectedPoints[0].y + ' ' + selectedData[0].units + '</td>';
                html += '</tr>';
                html += '</tbody></table>';
            }
            // TODO: show a nice legend for feature info panel with >1 line.
        } else {
            html = '<p>' + x + '</p>';
            html += '<table class="mouseover"><tbody>';
            selectedPoints.forEach((point, index)=>{
                const styleAttribute = defined(selectedColors) ? ('style="background-color: ' + selectedColors[index] + '" ') : '';
                html += '<tr>';
                html += '<td class="color" ' + styleAttribute + '></td>';
                html += '<td>' + selectedData[index].itemName + '</td>';
                html += '<td>' + selectedData[index].columnName + '</td>';
                html += '<td>' + point.y + ' ' + selectedData[index].units + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
        return html;
    }

    // Tooltips.
    function showTooltip() {
        if (data.length === 0) {
            return;
        }
        const localCoords = d3.mouse(g[0][0]);
        const hoverX = scales.x.invert(localCoords[0]);
        // Find the closest x in all the lines; then find all the ys that have that x.
        const closestXPts = data.map(point=>point.reduce((previous, current)=>
            Math.abs(current.x - hoverX) < Math.abs(previous.x - hoverX) ? current : previous
        ));
        const closestXPt = closestXPts.reduce((previous, current)=>
            Math.abs(current.x - hoverX) < Math.abs(previous.x - hoverX) ? current : previous
        );
        const nearlyEqual = (_, index)=>(Math.abs(closestXPts[index].x - closestXPt.x) < threshold);
        const selectedPoints = closestXPts.filter(nearlyEqual);
        const selectedData = data.filter(nearlyEqual);
        const selectedColors = defined(colors) ? colors.filter(nearlyEqual) : undefined;
        const selected = g.select('.selection').selectAll('circle').data(selectedPoints);

        selected.enter().append('circle');
        selected
            .attr('cx', (d)=>scales.x(d.x))
            .attr('cy', (d)=>scales.y(d.y))
            // .attr('r', 3)
            .style('fill', (d, i)=>defined(selectedColors) ? selectedColors[i] : '');
            // .style('opacity', 0.65);
        selected.exit().remove();

        tooltip
            .html(makeMouseOverHtml(state.mini, selectedPoints, selectedData, selectedColors))
            .style('top', function() {
                return Math.min((d3.event.pageY - tooltipOffset.top), Math.max(5, window.innerHeight - tooltip[0][0].offsetHeight)) + 'px';
            })
            .style('left', function() {
                return (d3.event.pageX + (-tooltip[0][0].offsetWidth - tooltipOffset.left)) + 'px';
            })
            .style('opacity', 1e-6)
            .style('display', 'block')
            .transition()
                .style('opacity', 1);
    }

    function hideTooltip() {
        g.select('.selection').selectAll('circle').data([]).exit().remove();
        tooltip.transition().style('opacity', 1e-6);//.style('display', 'none'); // too flashy with display none; but can leave hidden div in front of other elements.
    }

    if (tooltip) {
        // Whenever the chart updates, remove the selected points and tooltips.
        hideTooltip();
        svg.on('mouseover', showTooltip)
            .on('mousemove', showTooltip)
            .on('click', showTooltip)
            .on('mouseout', hideTooltip);
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
        .text('No preview available')
        .style('text-anchor', 'middle')
        .attr('x', element.offsetWidth / 2 - margin.left)
        .attr('y', (size.height - 24) / 2);
}

function calculateSize(element, margin, state) {
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;
    const heightMinusXAxisLabelHeight = height - ((defined(state.axisLabel) && defined(state.axisLabel.x)) ? xAxisLabelHeight : 0);
    const plotHeight = heightMinusXAxisLabelHeight - (state.mini ? 0 : xAxisHeight);
    return {
        width: width,
        height: height,
        heightMinusXAxisLabelHeight: heightMinusXAxisLabelHeight,
        plotHeight: plotHeight
    };
}

function calculateScales(size, state) {
    const data = state.data;
    let domain = state.domain;
    // data is only used if domain is undefined, to choose the min-max.
    if (!defined(domain)) {
        if (!defined(data)) {
            return;
        }
        domain = {
            x: [d3.min(data, a=>d3.min(a, d=>d.x)), d3.max(data, a=>d3.max(a, d=>d.x))],
            y: [d3.min(data, a=>d3.min(a, d=>d.y)), d3.max(data, a=>d3.max(a, d=>d.y))],
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


module.exports = LineChart;
