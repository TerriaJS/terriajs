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

const angleInterpolator = d3Interpolate(0, Math.PI * 2); // interpolate from 0 to 2*pi radians

// // We decided not to use a seconds hand, but I've left the animation code in here just in case we change our minds.
// function secondHandGenerator(radius, angle) {
//     const data = [{angle: 0, radius: 0}, {angle: angle, radius: radius}];

//     return d3LineRadial()
//         .angle((d) => d.angle)
//         .radius((d) => d.radius)(data);
// }

/**
 * Runs the timer animation, making an arc fill from 0 to 100% of the circle.
 * @param {number} radius 
 * @param {number} interval 
 * @param {DOMElement} elapsedTimeElement 
 * @param {DOMElement} backgroundElement 
 * @param {DOMElement} deltaOpacity 
 */
function animateTimer(radius, interval, elapsedTimeElement, backgroundElement, deltaOpacity, opacityAnimationInterval) {

    elapsedTimeElement.transition('arc')
        .duration(interval * 1000)
        .ease(d3EaseLinear)
        // attrTween requires a generator function A that returns a function B
        // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
        .attrTween("d", () => (t) => arcGenerator(radius)({ endAngle: angleInterpolator(t) }));

    // Rather than check if the opacity transitions are already operating (which they might be, because they use `interval` to run repeatedly),
    // we just re-add them regardless. Because they have the same d3 transition name, the new transition replaces the previous one.
    const minOpacity = 0.1;

    function allOpacityTransitions() {
        const backgroundMaxOpacity = parseFloat(backgroundElement.style('opacity'));
        const backgroundMinOpacity = backgroundMaxOpacity - deltaOpacity > minOpacity ? backgroundMaxOpacity - deltaOpacity : minOpacity; // clamp min to 0.1
        const elapsedTimeMaxOpacity = parseFloat(elapsedTimeElement.style('opacity'));
        const elapsedTimeMinOpacity = elapsedTimeMaxOpacity - deltaOpacity > minOpacity ? elapsedTimeMaxOpacity - deltaOpacity : minOpacity;
        console.log(backgroundMinOpacity, backgroundMaxOpacity, elapsedTimeMinOpacity, elapsedTimeMaxOpacity);

        opacityTransition(backgroundElement, backgroundMaxOpacity, backgroundMinOpacity, 'backgroundOut');
        opacityTransition(backgroundElement, backgroundMinOpacity, backgroundMaxOpacity, 'backgroundIn', opacityAnimationInterval / 2);

        // Elapsed time
        opacityTransition(elapsedTimeElement, elapsedTimeMaxOpacity, elapsedTimeMinOpacity, 'timeOut');
        opacityTransition(elapsedTimeElement, elapsedTimeMinOpacity, elapsedTimeMaxOpacity, 'timeIn', opacityAnimationInterval / 2);
    }

    function opacityTransition(element, start, end, name, delay = 0) {
        element.transition(name)
            .delay(delay)
            .duration(opacityAnimationInterval / 2)
            .styleTween("opacity", () => (t) => d3Interpolate(start, end)(t));
    }

    allOpacityTransitions(opacityAnimationInterval, backgroundElement, elapsedTimeElement, deltaOpacity);

    d3Interval(() => {
        // Background
        allOpacityTransitions(opacityAnimationInterval, backgroundElement, elapsedTimeElement, deltaOpacity);
    }, opacityAnimationInterval);

    // // LINE VERSION OF SECONDS HAND // //
    // const secondHandInterval = 5 * 1000;
    // const secondHandTransition = () => secondsHandElement.transition('secondsHand')
    // .duration(secondHandInterval)
    // .ease(d3EaseLinear)
    // // attrTween requires a generator function A that returns a function B
    // // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
    // .attrTween("d", (d) => (t) => secondHandGenerator(radius, angleInterpolator(t)));
    // secondHandTransition();

    // d3Interval(secondHandTransition, secondHandInterval);
    // // END // //

    // // ARC VERSION OF SECONDS HAND // //
    // const secondHandInterval = 5 * 1000;
    // const secondHandTransition = () => secondsHandElement.transition('secondsHand')
    // .duration(secondHandInterval)
    // .ease(d3EaseLinear)
    // // attrTween requires a generator function A that returns a function B
    // // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
    // .attrTween("d", () => (t) => arcGenerator(radius)({ endAngle: angleInterpolator(t) }));
    // secondHandTransition();

    // d3Interval(secondHandTransition, secondHandInterval);
    // // END // //
}

/**
 * Adds a new timer to the DOM.
 * @param {number} radius
 * @param {number} interval how long the timer runs for
 * @param {string} containerId the id of the element to insert the timer into
 * @param {string} elapsedTimeClass a class for styling the animation that fills the timer as it runs
 * @param {string} backgroundClass a class for styling the timer's background circle
 */
export function createTimer(radius, interval, containerId, elapsedTimeClass, backgroundClass) {

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

    // // LINE VERSION OF SECONDS HAND // //
    // const secondsHand = g.append('path')
    //     .attr('class', secondsHandClass)
    //     .attr('d', secondHandGenerator(radius, 0));
    // // END // //

    // // ARC VERSION OF SECONDS HAND //
    // const secondsHand = g.append('path')
    //     .attr('class', secondsHandClass)
    //     .datum({ endAngle: 0 })
    //     .attr('d', arcGenerator(radius));
    // // END // //
}

/**
 * Update an existing timer. This will restart the animation.
 * @param {number} radius
 * @param {number} interval how long the timer runs for
 * @param {string} containerId the id of the element to insert the timer into
 */
export function updateTimer(radius, interval, containerId, elapsedTimeClass, backgroundClass) {
    const elapsedTimeElement = d3Select('#' + containerId).select('.' + elapsedTimeClass);
    if (!defined(elapsedTimeElement) || elapsedTimeElement.empty()) {
        // If we couldn't select the container from the DOM, abort!
        // A missing timer is not a big problem, so we fail silently.
        return null;
    }

    const backgroundElement = d3Select('#' + containerId).select('.' + backgroundClass);
    if (!defined(backgroundElement) || backgroundElement.empty()) {
        return null;
    }

    animateTimer(radius, interval, elapsedTimeElement, backgroundElement, 0.5, 3 * 1000);
}