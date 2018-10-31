'use strict';

import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {
    render(chart, chartData, { chartTransform, scales }) {
        const n = chartData.points.length;
        // spacing is the number of pixels per data point. When it's very low, we want to make the lines
        // thinner and lighter
        const spacing = (scales.x(chartData.points[n - 1].x) - scales.x(chartData.points[0].x)) / n;
        d3Sync(chart, chartData.points, 'rect', 
            (el, isNew) => el
                .style('fill', chartData.color || 'turquoise')
                .attr('fill-opacity', spacing > 3 ? 0.4 : 0.2) // Perhaps this should even be 0
                .attr('x', d => scales.x(d.x))
                .attr('width', spacing > 20 ? 3: 1)
                .attr('y', 0)
                .attr('height', scales.y.undefined(1)),
            chartTransform);
    }
}

module.exports = MomentChart;
