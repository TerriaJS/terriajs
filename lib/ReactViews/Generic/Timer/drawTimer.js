import { arc as d3Arc } from 'd3-shape';
import { select as d3Select } from 'd3-selection';
import { interval as d3Interval } from 'd3-timer';
import { interpolate as d3Interpolate } from 'd3-interpolate';

import defined from 'terriajs-cesium/Source/Core/defined';

function drawTimer(radius, interval, containerId, elapsedTimeClass = '', backgroundClass = '') {
    // arc is a function that returns a string representing the svg path of an arc
    const arc = d3Arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(0);

    console.log(containerId);

    const container = d3Select('#' + containerId);
    if (!defined(container)) {
        // If we couldn't select the container from the DOM, abort!
        // A missing timer is not a big problem, so we fail silently.
        return null;
    }

    const diameter = 2 * radius;

    const g = container.append('svg')
        .attr('width', diameter)
        .attr('height', diameter)
        .append('g')
            // We want to translate everything down and left so that the entire circle is draw in view, not just the 
            // bottom right quadrant
            .attr("transform", `translate(${radius},${radius})`);

    // Add background circle
    g.append('circle')
        .attr('class', backgroundClass)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', radius);

    // Add arc representing the elapsed time
    const elapsedTime = g.append('path')
        .datum({endAngle: 0})
        .attr('class', elapsedTimeClass)
        .attr('d', arc);

    const interpolator = d3Interpolate(0, Math.PI * 2); // interpolate from 0 to 2*pi radians

    const animateTimer = () =>
        elapsedTime.transition()
            .duration(interval * 1000)
            // attrTween requires a generator function A that returns a function B
            // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
            .attrTween("d", () => (t) => arc({ endAngle: interpolator(t) }));

    animateTimer();

    d3Interval(() => animateTimer(), interval * 1000);
}

export default drawTimer;