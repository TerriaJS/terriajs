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
        const scales = calculateScales(element, state.domain, margin, state.data);
        drawPoints(element, scales, margin, state);
    },

    destroy(element) {
        // Clean up.
    }

};


function drawPoints(element, scales, margin, state) {
    const data = state.data;
    const colors = state.colors;

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
        .style('stroke', (d, i)=>defined(colors) ? colors[i] : 'gray')
        .style('fill', 'none')
        .style('stroke-width', 2);

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

    const y = d3.scale.linear()
        .range([height, 0])
        .domain(domain.y);

    return {x: x, y: y};
}


module.exports = LineChart;
