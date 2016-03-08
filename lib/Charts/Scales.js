'use strict';

import d3 from 'd3';

import defined from 'terriajs-cesium/Source/Core/defined';
import getUniqueValues from '../Core/getUniqueValues';

const unknown = 'unknown';

const Scales = {
    /**
     * Calculates the appropriate d3 scales.
     *
     * @param  {Object} size Size as returned by Size.
     * @param  {Object} [domain] Domain with x and y properties.
     * @param  {Number[]} domain.x [x-minimum, x-maximum].
     * @param  {Number[]} domain.y An object with keys being the different units, and values being [y-minimum, y-maximum] for those units. Use unknown if no units given.
     * @param {ChartData[]} data The data for each line. This is required to extract units. Also if no domain is provided, it is calculated from the data.
     * @return {Object} The appropriate d3 scales.
     */
    calculate(size, domain, data) {
        if (data.length === 0) {
            return;
        }
        const allUnits = getUniqueValues(data.map(line=>(line.units || unknown)));
        if (!defined(domain)) {
            // domains is an Array of the domains for each data element, with the units.
            const domains = data.map(line=>{
                return {units: line.units || unknown, domain: line.getDomain()};
            });
            if (!defined(domains)) {
                return;
            }
            // domain.x is a simple [minx, maxx] array.
            // domain.y is an object with keys being the different units, and values being [miny, maxy].
            domain = {
                x: [d3.min(domains.map(l=>l.domain.x), x=>x[0]), d3.max(domains.map(l=>l.domain.x), x=>x[1])],
                y: {}
            };
            allUnits.forEach(theseUnits=>{
                const domainsWithTheseUnits = domains.filter(l=>(l.units === theseUnits));
                domain.y[theseUnits] = [
                    d3.min(domainsWithTheseUnits, d=>d.domain.y[0]),
                    d3.max(domainsWithTheseUnits, d=>d.domain.y[1])
                ];
            });
            for (var theseUnits in domain.y) {
               if (domain.y.hasOwnProperty(theseUnits)) {
                    const thisYDomain = domain.y[theseUnits];
                    // If the y-domain is positive and could reasonably be displayed to include zero, expand it to do so.
                    // (Eg. the range is 5 to 50, do it; if it is 5 to 8, do not. Set the boundary arbitrarily at 5 to 12.5, ie. 1:2.5.)
                    if ((thisYDomain[0] > 0) && (thisYDomain[0] / thisYDomain[1] < 0.4)) {
                        thisYDomain[0] = 0;
                    }
                    // If the y-domain is negative and could reasonably be displayed to include zero, expand it to do so.
                    if ((thisYDomain[1] < 0) && (thisYDomain[0] / thisYDomain[1] < 0.4)) {
                        thisYDomain[1] = 0;
                    }
                }
            }
        }

        let xScale;
        if (domain.x[0] instanceof Date) {
            xScale = d3.time.scale();
        } else {
            xScale = d3.scale.linear();
        }

        xScale.range([0, size.width]).domain(domain.x);

        // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive or entirely negative),
        // but not if it is in the middle of the plot (ie. if the y-domain includes zero).
        //
        // For now, we assume that the x-axis will be displayed aligned with the first data series' y-scale.

        const mainYDomain = domain.y[allUnits[0]];
        const yContainsZero = (mainYDomain[0] < 0 && mainYDomain[1] > 0);

        if (yContainsZero) {
            const yPositiveOnly = d3.scale.linear()
                .range([size.plotHeight, 0])
                .domain([0, mainYDomain[1]]);
            if (yPositiveOnly(mainYDomain[0]) < size.heightMinusXAxisLabelHeight) {
                // There's only a very small negative range. The y-axis is near the bottom of the panel.
                // The x-axis can be xAxisHeight from the bottom, and the negative part of the y-axis fits in the xAxisHeight.
                // We want to use this scale, but we need to expand its range and domain. To do this, just use plotHeight = yPositiveOnly(mainYDomain[0]).
                size.plotHeight = yPositiveOnly(mainYDomain[0]);
            } else {
                // There's a big negative range, so the y-axis is not near the bottom of the panel.
                size.plotHeight = size.heightMinusXAxisLabelHeight;
            }
        }

        const yScales = {};
        for (theseUnits in domain.y) {
           if (domain.y.hasOwnProperty(theseUnits)) {
                const thisYDomain = domain.y[theseUnits];
                yScales[theseUnits] = d3.scale.linear()
                    .range([size.plotHeight, 0])
                    .domain(thisYDomain);
            }
        }

        return {x: xScale, y: yScales};
    },

    unknownUnits: unknown

};


module.exports = Scales;
