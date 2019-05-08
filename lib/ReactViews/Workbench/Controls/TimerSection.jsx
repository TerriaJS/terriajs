"use strict";

import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import defined from "terriajs-cesium/Source/Core/defined";

import ObserveModelMixin from "../../ObserveModelMixin";
import Timer from "../../Generic/Timer/Timer";

import Styles from "./timer-section.scss";

const TimerSection = createReactClass({
  displayName: "TimerSection",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired
  },

  isEnabled() {
    return (
      defined(this.props.item) &&
      defined(this.props.item.polling) &&
      this.props.item.polling.isPolling &&
      defined(this.props.item.polling.nextScheduledUpdateTime)
    );
  },

  getInitialState() {
    return {
      secondsLeft: 0
    };
  },

  getCountdownDuration() {
    // How many seconds until our next update?
    return Math.floor((this.props.item.polling.nextScheduledUpdateTime.getTime() - new Date().getTime()) / 1000);
  },

  getTimerStartTime() {
    return new Date(this.props.item.polling.nextScheduledUpdateTime - (this.props.item.polling.seconds * 1000));
  },

  // Ticks down the countdown clock
  countdown() {
    if (this.state.secondsLeft > 0) {
      this.setState(() => {
        return {
          secondsLeft: this.state.secondsLeft - 1
        };
      });
    } else {
      // Stop.
      clearInterval(this.interval);
    }
  },

  startCountdown() {
    this.setState({
      secondsLeft: this.getCountdownDuration()
    });
    this.interval = setInterval(this.countdown, 1000);
  },

  getCountdownString() {
    const date = new Date(null);
    date.setSeconds(this.state.secondsLeft);
    return date.toISOString().substr(11, 8);
  },

  componentDidUpdate() {
    if (!this.isEnabled()) {
      return;
    }

    if (this.nextUpdate !== this.props.item.polling.nextScheduledUpdateTime) {
      if (defined(this.interval)) {
        clearInterval(this.interval);
      }
      this.startCountdown();
      this.nextUpdate = this.props.item.polling.nextScheduledUpdateTime;
    }
  },

  componentDidMount() {
    if (!this.isEnabled()) {
      return;
    }

    this.startCountdown();
  },

  componentWillUnmount() {
    clearInterval(this.interval);
  },

  render() {
    return (
      <div>
        <If
          condition={this.isEnabled()}
        >
          <div className={Styles.section}>
            <div className={Styles.timerContainer}>
              <Timer
                tooltipText={`Next data update at ${
                  this.props.item.polling.nextScheduledUpdateTime
                }`}
                radius={10}
                start={getTimerStartTime()}
                stop={this.props.item.polling.nextScheduledUpdateTime}
              />
            </div>
            <span>Next data update in {this.getCountdownString()}</span>
          </div>
        </If>
      </div>
    );
  }
});

module.exports = TimerSection;
