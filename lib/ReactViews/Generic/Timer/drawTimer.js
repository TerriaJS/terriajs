import { arc as d3Arc } from 'd3-shape';
import { select as d3Select } from 'd3-selection';
import { interval as d3Interval } from 'd3-timer';
import { interpolate as d3Interpolate } from 'd3-interpolate';
import { easeLinear as d3EaseLinear } from 'd3-ease';

import defined from 'terriajs-cesium/Source/Core/defined';

/**
 * Returns a generator function that returns a string representing the svg path of an arc.
 * @param {number} radius 
 */
function arcGenerator(radius) {
    return d3Arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(0);
}

// Interpolate from 0 to 2*pi radians
const angleInterpolator = d3Interpolate(0, Math.PI * 2);

/**
 * Runs the timer animation, making an arc fill from 0 to 100% of the circle.
 * @param {number} radius Radius of timer.
 * @param {number} interval Timer duration in seconds.
 * @param {DOMElement} elapsedTimeElement SVG path containing the elapsed time "pie".
 * @param {DOMElement} backgroundElement SVG path containing the background circle.
 * @param {DOMElement} [options.deltaOpacity=0.5] Change in opacity when fading in and out timer.
 * @param {DOMElement} [options.opacityAnimationInterval=3] How long fade in/out lasts in seconds.
 * @param {DOMElement} [options.minOpacity=0.1] When fading out, doesn't let opacity go below `minOpacity`.
 */
function animateTimer(radius, interval, elapsedTimeElement, backgroundElement, options = {}) {

    options = {
        deltaOpacity: defined(options.deltaOpacity) ? options.deltaOpacity : 0.7,
        opacityAnimationInterval: defined(options.opacityAnimationInterval) ? options.opacityAnimationInterval : 3,
        minOpacity: defined(options.minOpacity) ? options.minOpacity : 0.1,
    };

    options.opacityAnimationInterval = options.opacityAnimationInterval * 1000; // seconds to milliseconds

    elapsedTimeElement.transition('arc')
        .duration(interval * 1000)
        .ease(d3EaseLinear)
        // attrTween requires a generator function A that returns a function B
        // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
        .attrTween("d", () => (t) => arcGenerator(radius)({ endAngle: angleInterpolator(t) }));

    // Rather than check if the opacity transitions are already operating (which they might be, because they use `interval` to run repeatedly),
    // we just re-add them regardless. Because they have the same d3 transition name, the new transition replaces the previous one.

    function allOpacityTransitions() {
        // Use the element's existing opacity as the maximum opacity.
        const backgroundMaxOpacity = parseFloat(backgroundElement.style('opacity'));
        // Clamp the minimum opacity to options.minOpacity.
        const backgroundMinOpacity = backgroundMaxOpacity - options.deltaOpacity > options.minOpacity ? backgroundMaxOpacity - options.deltaOpacity : options.minOpacity;
        const elapsedTimeMaxOpacity = parseFloat(elapsedTimeElement.style('opacity'));
        const elapsedTimeMinOpacity = elapsedTimeMaxOpacity - options.deltaOpacity > options.minOpacity ? elapsedTimeMaxOpacity - options.deltaOpacity : options.minOpacity;

        opacityTransition(backgroundElement, backgroundMaxOpacity, backgroundMinOpacity, 'backgroundOut');
        opacityTransition(backgroundElement, backgroundMinOpacity, backgroundMaxOpacity, 'backgroundIn', options.opacityAnimationInterval / 2);

        // Elapsed time
        opacityTransition(elapsedTimeElement, elapsedTimeMaxOpacity, elapsedTimeMinOpacity, 'timeOut');
        opacityTransition(elapsedTimeElement, elapsedTimeMinOpacity, elapsedTimeMaxOpacity, 'timeIn', options.opacityAnimationInterval / 2);
    }

    function opacityTransition(element, start, end, name, delay = 0) {
        element.transition(name)
            .delay(delay)
            .duration(options.opacityAnimationInterval / 2)
            .styleTween("opacity", () => (t) => d3Interpolate(start, end)(t));
    }

    allOpacityTransitions(options.opacityAnimationInterval, backgroundElement, elapsedTimeElement, options.deltaOpacity);

    d3Interval(() => {
        // Background
        allOpacityTransitions(options.opacityAnimationInterval, backgroundElement, elapsedTimeElement, options.deltaOpacity);
    }, options.opacityAnimationInterval);
}

/**
 * Adds a new timer to the DOM.
 * @param {number} radius Radius of timer.
 * @param {string} containerId The id of the element to insert the timer into.
 * @param {string} elapsedTimeClass A class for styling the animation that fills the timer as it runs.
 * @param {string} backgroundClass A class for styling the timer's background circle.
 */
export function createTimer(radius, containerId, elapsedTimeClass, backgroundClass) {

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
        .attr('class', elapsedTimeClass)
        .datum({ endAngle: 0 })
        .attr('d', arcGenerator(radius));
}

/**
 * Update an existing timer. This will restart the animation.
 * @param {number} radius Radius of timer.
 * @param {number} interval Timer duration in seconds.
 * @param {string} containerId The id of the element to insert the timer into.
 * @param {string} elapsedTimeClass A class for styling the animation that fills the timer as it runs.
 * @param {string} backgroundClass A class for styling the timer's background circle.
 */
export function updateTimer(radius, interval, containerId, elapsedTimeClass, backgroundClass) {
    const elapsedTimeElement = d3Select('#' + containerId).select('.' + elapsedTimeClass);
    if (!defined(elapsedTimeElement) || elapsedTimeElement.empty()) {
        // If we couldn't select the element from the DOM, abort!
        // A missing timer is not a big problem, so we fail silently.
        return null;
    }

    const backgroundElement = d3Select('#' + containerId).select('.' + backgroundClass);
    if (!defined(backgroundElement) || backgroundElement.empty()) {
        return null;
    }

    animateTimer(radius, interval, elapsedTimeElement, backgroundElement);
}