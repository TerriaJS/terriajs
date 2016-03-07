'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const Scales = {

    calculate(size, state) {
        let domain = state.domain;
        // pointArrays are only used if domain is undefined, to choose the full domain.
        if (!defined(domain)) {
            const domains = state.data.map(line=>line.getDomain());
            if (!defined(domains)) {
                return;
            }
            domain = {
                x: [d3.min(domains, d=>d.x[0]), d3.max(domains, d=>d.x[1])],
                y: [d3.min(domains, d=>d.y[0]), d3.max(domains, d=>d.y[1])]
            };
            // If the y-domain is positive and could reasonably be displayed to include zero, expand it to do so.
            // (Eg. the range is 5 to 50, do it; if it is 5 to 8, do not. Set the boundary arbitrarily at 5 to 12.5, ie. 1:2.5.)
            if ((domain.y[0] > 0) && (domain.y[0] / domain.y[1] < 0.4)) {
                domain.y[0] = 0;
            }
            // If the y-domain is negative and could reasonably be displayed to include zero, expand it to do so.
            if ((domain.y[1] < 0) && (domain.y[0] / domain.y[1] < 0.4)) {
                domain.y[1] = 0;
            }
        }

        let x;
        if (domain.x[0] instanceof Date) {
            x = d3.time.scale();
        } else {
            x = d3.scale.linear();
        }

        x.range([0, size.width]).domain(domain.x);

        // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive or entirely negative),
        // but not if it is in the middle of the plot (ie. if the y-domain includes zero).

        const yContainsZero = (domain.y[0] < 0 && domain.y[1] > 0);

        if (yContainsZero) {
            const yPositiveOnly = d3.scale.linear()
                .range([size.plotHeight, 0])
                .domain([0, domain.y[1]]);
            if (yPositiveOnly(domain.y[0]) < size.heightMinusXAxisLabelHeight) {
                // There's only a very small negative range. The y-axis is near the bottom of the panel.
                // The x-axis can be xAxisHeight from the bottom, and the negative part of the y-axis fits in the xAxisHeight.
                // We want to use this scale, but we need to expand its range and domain. To do this, just use plotHeight = yPositiveOnly(domain.y[0]).
                size.plotHeight = yPositiveOnly(domain.y[0]);
            } else {
                // There's a big negative range, so the y-axis is not near the bottom of the panel.
                size.plotHeight = size.heightMinusXAxisLabelHeight;
            }
        }

        const y = d3.scale.linear()
            .range([size.plotHeight, 0])
            .domain(domain.y);

        return {x: x, y: y};
    }

};


module.exports = Scales;
