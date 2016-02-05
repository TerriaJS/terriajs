'use strict';

const d3 = require('d3');

const defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

const defaultMargin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50
};

const LineChart = {

    create(element, props, state) {
        const svg = d3.select(element).append('svg')
            .attr('class', 'd3')
            .attr('width', props.width)
            .attr('height', props.height);

        svg.append('g')
            .attr('class', 'line-chart');

        this.update(element, state);
    },

    update(element, state) {
        const margin = defaultValue(state.margin, defaultMargin);
        const scales = calculateScales(element, state.domain, margin);
        drawPoints(element, scales, state.data, margin);
    },

    destroy(element) {
        // Clean up.
    }

};


function drawPoints(element, scales, data, margin) {
    const g = d3.select(element).selectAll('.line-chart');
    g.attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

    const lines = g.selectAll('.line').data(data).attr('class', 'line');

    const path = d3.svg.line()
        .x((d)=>scales.x(d.x))
        .y((d)=>scales.y(d.y))
        .interpolate('basic');

    // Enter.
    lines.enter().append('path')
        .attr('class', 'line')
        .attr('d', path)
        .style('stroke', '#ABC')
        .style('fill', 'none')
        .style('stroke-width', 2);

    // Exit.
    lines.exit().remove();
}

function calculateScales(element, domain, margin) {
    if (!domain) {
        return null;
    }

    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const x = d3.scale.linear()
        .range([0, width])
        .domain(domain.x);

    const y = d3.scale.linear()
        .range([height, 0])
        .domain(domain.y);

    return {x: x, y: y};
}


module.exports = LineChart;
