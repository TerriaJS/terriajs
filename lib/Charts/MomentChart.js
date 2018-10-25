'use strict';

import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {
    render(chart, chartData, { chartTransform, scales }) {
        const n = chartData.points.length;
        const density = (scales.x(chartData.points[n - 1].x) - scales.x(chartData.points[0].x)) / n;
        d3Sync(chart, chartData.points, 'rect', 
            (el, isNew) => el
                .style('fill', chartData.color || 'turquoise')
                .attr('fill-opacity', density > 3 ? 0.4 : 0.0)
                .attr('x', d => scales.x(d.x))
                .attr('width', density > 20 ? 3: 1)
                .attr('y', 0)
                .attr('height', scales.y.undefined(1)),
            chartTransform);
    }
}

module.exports = MomentChart;
