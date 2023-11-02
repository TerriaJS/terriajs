"use strict";

import { arc as d3Arc } from "d3-shape";
import { select as d3Select } from "d3-selection";
import { interpolate as d3Interpolate } from "d3-interpolate";
import { easeLinear as d3EaseLinear } from "d3-ease";
import "d3-transition";

import defined from "terriajs-cesium/Source/Core/defined";

/**
 * Returns a function that returns a string representing the svg path of an arc.
 *
 * @param {number} radius
 */
function arcFactory(radius) {
  return d3Arc().innerRadius(0).outerRadius(radius).startAngle(0);
}

// Interpolate from 0 to 2*pi radians
function angleInterpolator(t, startAngle = 0) {
  return d3Interpolate(startAngle, Math.PI * 2)(t);
}

/**
 * Runs the timer animation, making an arc fill from 0 to 100% of the circle.
 * @param {number} radius Radius of timer.
 * @param {number} interval Timer duration in seconds.
 * @param {DOMElement} elapsedTimeElement SVG path containing the elapsed time "pie".
 * @param {DOMElement} backgroundElement SVG path containing the background circle.
 * @param {number} [options.deltaOpacity=0.5] Change in opacity when fading in and out timer.
 * @param {number} [options.opacityAnimationInterval=3] How long fade in/out lasts in seconds.
 * @param {number} [options.minOpacity=0.1] When fading out, doesn't let opacity go below `minOpacity`.
 * @param {number} [options.elapsed=0] How much time has already passed.
 */
function animateTimer(
  radius,
  interval,
  elapsedTimeElement,
  backgroundElement,
  options = {}
) {
  options = {
    deltaOpacity: defined(options.deltaOpacity) ? options.deltaOpacity : 0.7,
    opacityAnimationInterval: defined(options.opacityAnimationInterval)
      ? options.opacityAnimationInterval
      : 3,
    minOpacity: defined(options.minOpacity) ? options.minOpacity : 0.1,
    elapsed: defined(options.elapsed) ? options.elapsed : 0
  };

  // The arc representing the elapsed time should be filled up to the current time.
  // We find the elapsed time as a percentage of the total duration, and then get the angle interpolator to calculate
  // the corresponding angle.
  const startAngle = angleInterpolator(options.elapsed / interval);
  elapsedTimeElement
    .datum({ endAngle: angleInterpolator(startAngle) })
    .transition("arc" + new Date().getTime().toString())
    .duration((interval - options.elapsed) * 1000) // d3 uses milliseconds
    .ease(d3EaseLinear)
    // attrTween requires a function A that returns an interpolator function B
    // when B is passed the time, t, it should return the new value of the attribute, in this case `d`
    .attrTween(
      "d",
      () => (t) =>
        arcFactory(radius)({ endAngle: angleInterpolator(t, startAngle) })
    );

  const opacityTransition = (element, max, repeatsLeft) => {
    if (repeatsLeft <= 0) {
      element.interrupt();
      return;
    }

    // Clamp the minimum opacity to options.minOpacity.
    const min =
      max - options.deltaOpacity > options.minOpacity
        ? max - options.deltaOpacity
        : options.minOpacity;

    element
      .transition("in")
      .duration((options.opacityAnimationInterval * 1000) / 2)
      .styleTween("opacity", () => (t) => d3Interpolate(max, min)(t));

    element
      .transition("out")
      .delay((options.opacityAnimationInterval * 1000) / 2)
      .duration((options.opacityAnimationInterval * 1000) / 2)
      .styleTween("opacity", () => (t) => d3Interpolate(min, max)(t))
      .on("end", () => opacityTransition(element, max, repeatsLeft - 1)); // start cycle again
  };

  // Start our opacity animation.
  const repeats = Math.ceil(interval / options.opacityAnimationInterval) - 1;

  // Use the element's existing opacity as the maximum opacity.
  // We calculate it here once and then pass it into opacityTransition to stop the animation's max opacity from drifting
  const backgroundMax = parseFloat(backgroundElement.style("opacity"));
  opacityTransition(backgroundElement, backgroundMax, repeats);

  const elaspedMax = parseFloat(elapsedTimeElement.style("opacity"));
  opacityTransition(elapsedTimeElement, elaspedMax, repeats);
}

/**
 * Adds a new timer to the DOM. Call {@link updateTimer()} to make it start animating.
 * @param {number} radius Radius of timer.
 * @param {string} containerId The id of the element to insert the timer into.
 * @param {string} elapsedTimeClass A class for styling the animation that fills the timer as it runs.
 * @param {string} backgroundClass A class for styling the timer's background circle.
 */
export function createTimer(
  radius,
  containerId,
  elapsedTimeClass,
  backgroundClass
) {
  const container = d3Select("#" + containerId);
  if (!defined(container)) {
    // If we couldn't select the container from the DOM, abort!
    // A missing timer is not a big problem, so we fail silently.
    return null;
  }

  const diameter = 2 * radius;

  const g = container
    .append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .append("g")
    // We want to translate everything down and left so that the entire circle is draw in view, not just the bottom
    // right quadrant
    .attr("transform", `translate(${radius},${radius})`);

  // Add background circle
  g.append("circle")
    .attr("class", backgroundClass)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", radius);

  // Add arc representing the elapsed time
  g.append("path")
    .attr("class", elapsedTimeClass)
    .datum({ endAngle: 0 })
    .attr("d", arcFactory(radius));
}

/**
 * Start an existing timer. This will restart the animation if it is already running.
 * @param {number} radius Radius of timer.
 * @param {number} interval Timer duration in seconds.
 * @param {string} containerId The id of the element to insert the timer into.
 * @param {string} elapsedTimeClass A class for styling the animation that fills the timer as it runs.
 * @param {string} backgroundClass A class for styling the timer's background circle.
 * @param {string} [elapsed=0] How much time (in seconds) has already passed.
 */
export function startTimer(
  radius,
  interval,
  containerId,
  elapsedTimeClass,
  backgroundClass,
  elapsed = 0
) {
  const elapsedTimeElement = d3Select("#" + containerId).select(
    "." + elapsedTimeClass
  );
  if (!defined(elapsedTimeElement) || elapsedTimeElement.empty()) {
    // If we couldn't select the element from the DOM, abort!
    // A missing timer is not a big problem, so we fail silently.
    return null;
  }

  const backgroundElement = d3Select("#" + containerId).select(
    "." + backgroundClass
  );
  if (!defined(backgroundElement) || backgroundElement.empty()) {
    return null;
  }

  animateTimer(radius, interval, elapsedTimeElement, backgroundElement, {
    elapsed: elapsed
  });
}
