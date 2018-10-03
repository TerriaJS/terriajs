'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import {line as d3Line} from 'd3-shape';
import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {

    render(chart, chartData, renderContext) {

        const { chartTransform, scales } = renderContext;
        const sx = scales.x, 
            sy = scales.y[chartData.units], 
            color = chartData.color || 'white';

        const path = d3Line() // TODO make it not a line graph :)
                .x(d => sx(d.x))
                //.y(d => sy(d.y))
                .y(d => 10)
                .defined(d => defined(d.y))
                (chartData.points);
                

        d3Sync(chart, [chartData], 'path', line => {
            line.attr('d', path)
                .style('fill', 'none')
                // .style('stroke', color);
                .style('stroke', 'magenta')
        }, chartTransform);

    }
}

module.exports = MomentChart;
