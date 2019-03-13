'use strict';

import {min as d3ArrayMin, max as d3ArrayMax} from 'd3-array';
import {scaleTime  as d3ScaleTime, scaleLinear as d3ScaleLinear} from 'd3-scale';
import defined from 'terriajs-cesium/Source/Core/defined';
import uniq from 'lodash.uniq';

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
        let theseUnits;
        if (data.length === 0) {
            return;
        }
        const allUnits = uniq(data.map(line=>(line.units || unknown)));
        if (!defined(domain)) {
            if (data[0].points.length === 0) {
                return;
            }
            // domains is an Array of the domains for each data element, with the units.
            const domains = data.map(line=>{
                return {units: line.units || unknown, domain: line.getDomain()};
            });
            // domain.x is a simple [minx, maxx] array.
            // domain.y is an object with keys being the different units, and values being [miny, maxy].
            domain = {
                x: [d3ArrayMin(domains.map(l=>l.domain.x), x=>x[0]), d3ArrayMax(domains.map(l=>l.domain.x), x=>x[1])],
                y: {}
            };
            allUnits.forEach(theUnits=>{
                const domainsWithTheseUnits = domains.filter(l=>(l.units === theUnits));
                domain.y[theUnits] = [
                    d3ArrayMin(domainsWithTheseUnits, d=>d.domain.y[0]),
                    d3ArrayMax(domainsWithTheseUnits, d=>d.domain.y[1])
                ];
            });
            for (const theseUnits in domain.y) {
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
                    const dataWithTheseUnits = data.filter(l=>(l.units === theseUnits));

                    // Override y-domain if user has requested it.

                    const yAxisMin = Math.min.apply(Math, dataWithTheseUnits.filter(d => defined(d.yAxisMin)).map(d => d.yAxisMin));
                    const yAxisMax = Math.max.apply(Math, dataWithTheseUnits.filter(d => defined(d.yAxisMax)).map(d => d.yAxisMax));
                    
                    if (yAxisMin === yAxisMin && yAxisMin !== Infinity && yAxisMin !== -Infinity && thisYDomain[0] < yAxisMin) {
                        thisYDomain[0] = yAxisMin;
                    }
                    
                    if (yAxisMax === yAxisMax && yAxisMax !== Infinity && yAxisMax !== -Infinity && thisYDomain[1] > yAxisMax) {
                        thisYDomain[1] = yAxisMax;
                    }
                }
            }
        }

        let xScale;
        if (domain.x[0] instanceof Date) {
            xScale = d3ScaleTime();
        } else {
            xScale = d3ScaleLinear();
        }

        xScale.range([0, size.width]).domain(domain.x);

        // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive),
        // but not if it is in the middle of the plot (ie. if the y-domain includes zero).
        //
        // For now, we assume that the x-axis will be displayed aligned with the first data series' y-scale.

        const mainYDomain = domain.y[allUnits[0]];
        const yContainsZero = (mainYDomain[0] < 0 && mainYDomain[1] > 0);

        if (yContainsZero) {
            const yPositiveOnly = d3ScaleLinear()
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
        } else if (mainYDomain[0] < 0 && mainYDomain[1] < 0) {
            // If range is entirely negative, the x-axis is at the top of the plot, so doesn't take up any space.
            size.plotHeight = size.heightMinusXAxisLabelHeight;
        }

        const yScales = {};
        for (theseUnits in domain.y) {
           if (domain.y.hasOwnProperty(theseUnits)) {
                const thisYDomain = domain.y[theseUnits];
                yScales[theseUnits] = d3ScaleLinear()
                    .range([size.plotHeight, 0])
                    .domain(thisYDomain);
            }
        }

        return {x: xScale, y: yScales};
    },

    unknownUnits: unknown,

    /**
     * Return the automatically-generated tick values, but with the last one removed if it is too close to the end.
     * @param  {d3.scale} scale The scale along which to calculate the tick values.
     * @param  {Integer} numberOfTicks Number of ticks.
     * @return {Array} Tick values.
     */
    truncatedTickValues(scale, numberOfTicks) {
        const values = scale.ticks(numberOfTicks);
        const lastValue = values[values.length - 1];
        if ((lastValue - scale.domain()[0]) / (scale.domain()[1] - scale.domain()[0]) > (1 - 0.4 / values.length)) {
            values.pop();
        }
        return values;
    }

};


module.exports = Scales;
