'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import {line as d3Line} from 'd3-shape';
import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {

    render(chart, chartData, renderContext) {

        const { chartTransform, scales } = renderContext;
        // TODO really consider units here.
        const sx = scales.x, 
            sy = scales.y[chartData.units], 
            color = chartData.color || 'white';

            d3Sync(chart, chartData.points, 'rect', (el, isNew) => {

            el
                .style('fill', 'turquoise')
                .attr('x', d => sx(d.x))
                .attr('width', 5)
                .attr('y', 0)
                .attr('fill-opacity', 0.4)
                .attr('height', '72%'); // TODO work out why 72% is the right number :)
        }, chartTransform);
    }
}

module.exports = MomentChart;
