'use strict';

import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {
    render(chart, chartData, { chartTransform, scales }) {
        d3Sync(chart, chartData.points, 'rect', 
            (el, isNew) => el
                .style('fill', chartData.color || 'turquoise')
                .attr('fill-opacity', 0.4)
                .attr('x', d => scales.x(d.x))
                .attr('width', 5)
                .attr('y', 0)
                .attr('height', '72%'), // TODO work out why 72% is the right number :)
            chartTransform);
    }
}

module.exports = MomentChart;
