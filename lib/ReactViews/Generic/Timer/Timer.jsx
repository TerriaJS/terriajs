"use strict";

import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";

import { createTimer, startTimer as startTimerAnimation } from "./drawTimer";

import Styles from "./timer.scss";

const Timer = createReactClass({
  displayName: "Timer",

  propTypes: {
    start: PropTypes.object.isRequired, // When the timer should start. js Date.
    stop: PropTypes.object.isRequired, // When the timer should stop. js Date.
    radius: PropTypes.number.isRequired, // the radius of the timer circle
    tooltipText: PropTypes.string
  },

  // We need a unique selector for the timer container.
  // If we use a class and there are multiple timers, our drawTimer functions don't know which one to draw to.
  containerId: "timer-container-" + new Date().getTime().toString(),

  getDefaultProps() {
    return {};
  },

  // Calculates how long the timer should run for (in seconds).
  calculateTimerInterval() {
    if (this.props.stop > this.props.start) {
      return (this.props.stop - this.props.start) / 1000;
    }

    // This is technically an error, but it's not a serious one or one that we should expose to the user, so we
    // ignore it
    return 0;
  },

  calculateElaspedTime() {
    const elapsed = Math.floor(
      (new Date().getTime() - this.props.start.getTime()) / 1000
    );
    if (elapsed > 0) {
      return elapsed;
    }
    return 0;
  },

  startTimer() {
    // only start the timer if the current time is after the start time passed in through props
    if (new Date().getTime() > this.props.start.getTime()) {
      startTimerAnimation(
        this.props.radius,
        this.calculateTimerInterval(),
        this.containerId,
        Styles.elapsedTime,
        Styles.backgroundCircle,
        this.calculateElaspedTime()
      );
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    // We only want to update and rerender if our props have actually changed.
    let changed = false;
    for (const key in Object.keys(this.props)) {
      if (nextProps[key] !== this.props[key]) {
        changed = true;
        break;
      }
    }
    return changed;
  },

  componentDidUpdate() {
    this.startTimer();
  },

  componentDidMount() {
    createTimer(
      this.props.radius,
      this.containerId,
      Styles.elapsedTime,
      Styles.backgroundCircle
    );

    this.startTimer();
  },

  render() {
    return (
      <div
        id={this.containerId}
        className={Styles.timer}
        title={this.props.tooltipText}
      />
    );
  }
});

module.exports = Timer;
