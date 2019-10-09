"use strict";

import { min as d3ArrayMin, max as d3ArrayMax } from "d3-array";
import {
  scaleTime as d3ScaleTime,
  scaleLinear as d3ScaleLinear
} from "d3-scale";
import defined from "terriajs-cesium/Source/Core/defined";
import uniq from "lodash.uniq";

const unknown = undefined;

const Scales = {
  /**
   * Calculates the appropriate d3 scales.
   *
   * @param  {Size} size Dimensions of plot area, as returned by Size class.
   * @param  {Object} [domain] Optional, object containing [minimum, maximum] arrays for each axis.
   * @param  {Number[]} domain.x [x-minimum, x-maximum].
   * @param  {Object} domain.y An object whose keys are units ("undefined" for unknown), values being [y-minimum, y-maximum].
   * @param  {ChartData[]} data The data for each line. This is required to extract units. Also if no domain is provided, it is calculated from the data.
   * @return {Object} {x, y: { [unit1], [unit2] ... }} where values are D3-scale objects.
   */
  calculate(size, domain, data, xPadding = 0) {
    const allUnits = uniq(data.map(line => line.units || unknown));
    function computeDomain() {
      if (data[0].points.length === 0) {
        return;
      }
      // if there is at least one domain with "showAll", filter the others out.
      const keepAll = data.filter(series => series.showAll).length === 0;

      const filteredData = data.filter(d => {
        return d.points.length > 0;
      });

      // domains is an Array of the domains for each data element, with the units.
      const domains = filteredData.map(function(series) {
        const seriesD = series.getDomain();
        series.yAxisMin = seriesD.y[0];
        series.yAxisMax = seriesD.y[1];
        return {
          units: series.units || unknown,
          domain: seriesD
        };
      });
      const importantDomains = domains.filter(
        (d, i) => keepAll || filteredData[i].showAll
      );

      // domain.x is a simple [minx, maxx] array.
      // domain.y is an object with keys being the different units, and values being [miny, maxy].
      const domain = {
        x: [
          d3ArrayMin(importantDomains.map(l => l.domain.x), x => x[0]),
          d3ArrayMax(importantDomains.map(l => l.domain.x), x => x[1])
        ],
        y: {}
      };
      allUnits.forEach(theUnits => {
        const domainsWithTheseUnits = domains.filter(l => l.units === theUnits);
        domain.y[theUnits] = [
          d3ArrayMin(domainsWithTheseUnits, d => d.domain.y[0]),
          d3ArrayMax(domainsWithTheseUnits, d => d.domain.y[1])
        ];
      });
      for (const theseUnits in domain.y) {
        if (domain.y.hasOwnProperty(theseUnits)) {
          const thisYDomain = domain.y[theseUnits];
          // If the y-domain is positive and could reasonably be expanded to include zero, do so.
          // (Eg. the range is 5 to 50, do it; if it is 5 to 8, do not. Set the boundary arbitrarily at 5 to 12.5, ie. 1:2.5.)
          if (thisYDomain[0] > 0 && thisYDomain[0] / thisYDomain[1] < 0.4) {
            thisYDomain[0] = 0;
          }
          // If the y-domain is negative and could reasonably be expanded to include zero, do so.
          if (thisYDomain[1] < 0 && thisYDomain[0] / thisYDomain[1] < 0.4) {
            thisYDomain[1] = 0;
          }
          const dataWithTheseUnits = data.filter(l => l.units === theseUnits);

          // Override y-domain if user has requested it.
          const yAxisMin = Math.min.apply(
            Math,
            dataWithTheseUnits
              .filter(d => defined(d.yAxisMin))
              .map(d => d.yAxisMin)
          );
          if (isFinite(yAxisMin) && thisYDomain[0] < yAxisMin) {
            thisYDomain[0] = yAxisMin;
          }

          const yAxisMax = Math.max.apply(
            Math,
            dataWithTheseUnits
              .filter(d => defined(d.yAxisMax))
              .map(d => d.yAxisMax)
          );
          if (isFinite(yAxisMax) && thisYDomain[1] > yAxisMax) {
            thisYDomain[1] = yAxisMax;
          }
        }
      }
      return domain;
    }

    function computeXScale() {
      const xScale =
        domain.x[0] instanceof Date ? d3ScaleTime() : d3ScaleLinear();
      return xScale.range([xPadding, size.width - xPadding]).domain(domain.x);
    }

    function computeYScales() {
      // The x-axis takes up plot space, if it is at the bottom of the plot (ie. if the y-domain is entirely positive),
      // but not if it is in the middle of the plot (ie. if the y-domain includes zero).
      //
      // For now, we assume that the x-axis will be displayed aligned with the first data series' y-scale.

      const mainYDomain = domain.y[allUnits[0]];
      const yContainsZero = mainYDomain[0] < 0 && mainYDomain[1] > 0;

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
      for (const theseUnits in domain.y) {
        if (domain.y.hasOwnProperty(theseUnits)) {
          const thisYDomain = domain.y[theseUnits];
          yScales[theseUnits] = d3ScaleLinear()
            .range([size.plotHeight, 0])
            .domain(thisYDomain);
        }
      }
      return yScales;
    }

    if (data.length === 0) {
      return;
    }
    if (!defined(domain)) {
      domain = computeDomain();
      if (!domain) {
        return;
      }
    }
    return { x: computeXScale(), y: computeYScales() };
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
    if (
      (lastValue - scale.domain()[0]) /
        (scale.domain()[1] - scale.domain()[0]) >
      1 - 0.4 / values.length
    ) {
      values.pop();
    }
    return values;
  }
};

module.exports = Scales;
