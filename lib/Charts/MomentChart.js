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

            d3Sync(chart, chartData.points, 'rect', (el, isNew) => {
            // issues: 
            //   units
            //   


            el
                .style('fill', 'turquoise')
                .attr('x', d => sx(d.x))
                .attr('width', 5)
                .attr('y', 0)
                .attr('height', '90%');//20);
        }, chartTransform);

    }
}

module.exports = MomentChart;
