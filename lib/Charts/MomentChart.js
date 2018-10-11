'use strict';

import BaseChart from './BaseChart';
import d3Sync from './d3Sync';

class MomentChart extends BaseChart {

    render(chart, chartData, renderContext) {

        const { chartTransform, scales } = renderContext;
        const sx = scales.x,                // TODO set up units properly.
            // sy = scales.y[chartData.units], // TODO make sensible choice around vertical units.
            color = chartData.color || 'turquoise';

            d3Sync(chart, chartData.points, 'rect', (el, isNew) => {
            el
                .style('fill', color)
                .attr('x', d => sx(d.x))
                .attr('width', 5)
                .attr('y', 0)
                .attr('fill-opacity', 0.4)
                .attr('height', '72%'); // TODO work out why 72% is the right number :)
        }, chartTransform);

    }
}

module.exports = MomentChart;
