import { arc as d3Arc } from 'd3-shape';
import { select as d3Select } from 'd3-selection';
import { interval as d3Interval } from 'd3-timer';
import { interpolate as d3Interpolate } from 'd3-interpolate';

import defined from 'terriajs-cesium/Source/Core/defined';

/**
 * Returns a generator function that returns a string representing the svg path of an arc.
 * @param {number} radius 
 */
function arc(radius) {
    return d3Arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(0);
}

const interpolator = d3Interpolate(0, Math.PI * 2); // interpolate from 0 to 2*pi radians

/**
 * Runs the timer animation, making an arc fill from 0 to 100% of the circle.
 * @param {number} radius 
 * @param {number} interval 
 * @param {DOMElement} elapsedTimeElement 
 */
function animateTimer(radius, interval, elapsedTimeElement) {
    elapsedTimeElement.transition()
        .duration(interval * 1000)
        // attrTween requires a generator function A that returns a function B
        // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
        .attrTween("d", () => (t) => arc(radius)({ endAngle: interpolator(t) }));
}

/**
 * Adds a new timer to the DOM.
 * @param {number} radius
 * @param {number} interval how long the timer runs for
 * @param {string} containerId the id of the element to insert the timer into
 * @param {string} elapsedTimeClass a class for styling the animation that fills the timer as it runs
 * @param {string} backgroundClass a class for styling the timer's background circle
 */
export function createTimer(radius, interval, containerId, elapsedTimeClass = '', backgroundClass = '') {

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
        .datum({ endAngle: 0 })
        .attr('class', elapsedTimeClass)
        .attr('d', arc(radius));

    if (interval === 0) {
        // Don't animate anything if there isn't a time interval to display
        return null;
    }

    animateTimer(radius, interval, elapsedTime);
}

/**
 * Update an existing timer. This will restart the animation.
 * @param {number} radius
 * @param {number} interval how long the timer runs for
 * @param {string} containerId the id of the element to insert the timer into
 */
export function updateTimer(radius, interval, containerId) {
    const elapsedTimeElement = d3Select('#' + containerId).select('path');
    if (!defined(elapsedTimeElement) || elapsedTimeElement.empty()) {
        // If we couldn't select the container from the DOM, abort!
        // A missing timer is not a big problem, so we fail silently.
        return null;
    }

    animateTimer(radius, interval, elapsedTimeElement);
}