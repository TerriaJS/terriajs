'use strict';

import {line as d3Line} from 'd3-shape';

import BaseChart from './BaseChart';

import d3Sync from './d3Sync';

class LineChart extends BaseChart {

    render(chart, chartData, renderContext) {

        const { chartTransform, scales } = renderContext;
        const sx = scales.x, sy = scales.y[chartData.units], color = chartData.color || 'white';
        const path = d3Line() // NOTE: it was originally 'basic', which is not an interpolation
                .x(d => sx(d.x))
                .y(d => sy(d.y))(chartData.points);

        d3Sync(chart, [chartData], 'path', line => {
            line.attr('d', path)
                .style('fill', 'none')
                .style('stroke', color);
        }, chartTransform);

    }
}

module.exports = LineChart;
