'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const defaultMargin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50
};

const transitionDuration = 1000; // milliseconds
const xAxisHeight = 30;

const LineChart = {

    create(element, props, state) {
        const svg = d3.select(element).append('svg')
            .attr('class', 'd3')
            .attr('width', props.width)
            .attr('height', props.height);

        const lineChart = svg.append('g')
            .attr('class', 'line-chart');

        lineChart.append('g')
            .attr('class', 'x axis');
        lineChart.append('g')
            .attr('class', 'y axis');

        this.update(element, state);
    },

    update(element, state) {
        const margin = defaultValue(state.margin, defaultMargin);
        const scales = calculateScales(element, state.domain, margin, state.data);
        render(element, scales, margin, state);
    },

    destroy(element) {
        // Clean up.
    }

};


function render(element, scales, margin, state) {
    const data = state.data;
    const colors = state.colors;

    const g = d3.select(element).selectAll('.line-chart');
    g.attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

    const xAxis = d3.svg.axis().scale(scales.x).orient('bottom');
    const bottom = element.offsetHeight - margin.top - margin.bottom - xAxisHeight;
    const y0 = Math.min(Math.max(scales.y(0), 0), bottom);
    g.select('.x.axis')
        .transition().duration(transitionDuration)
        .attr('transform', 'translate(0,' + y0 + ')')
        .call(xAxis);

    const yAxis = d3.svg.axis().scale(scales.y).orient('left');
    g.select('.y.axis').transition().duration(transitionDuration).call(yAxis);

    const lines = g.selectAll('.line').data(data).attr('class', 'line');
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
        .style('stroke', (d, i)=>defined(colors) ? colors[i] : 'gray')
        .style('stroke-width', 2);

    // Enter and update.
    lines.transition().duration(transitionDuration)
        .attr('d', path)
        .style('opacity', 1)
        .style('stroke', (d, i)=>defined(colors) ? colors[i] : 'gray');

    // Exit.
    lines.exit().remove();
}

function calculateScales(element, domain, margin, data) {
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
        // (Eg. the range is 5 to 50, do it; if it is 5 to 8, do not. Set the boundary arbitrarily at 5 to 20, ie. 1:4.)
        if ((domain.y[0] > 0) && (domain.y[0] / domain.y[1] < 0.25)) {
            domain.y[0] = 0;
        }
    }

    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    let x;
    if (domain.x[0] instanceof Date) {
        x = d3.time.scale();
    } else {
        x = d3.scale.linear();
    }

    x.range([0, width]).domain(domain.x);

    // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive or entirely negative),
    // but not if it is in the middle of the plot (ie. if the y-domain includes zero).
    // (This can be refined, if the x-axis is near the bottom of the plot.)

    let plotHeight = height - xAxisHeight;  // Suitable if the entire y-domain is entirely positive or entirely negative.
    if (domain.y[0] < 0 && domain.y[1] > 0) {
        plotHeight = height; // Unrefined version.
    }

    const y = d3.scale.linear()
        .range([plotHeight, 0])
        .domain(domain.y);

    return {x: x, y: y};
}


module.exports = LineChart;
