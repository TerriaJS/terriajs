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

  getInitialState() {
    return {
      secondsLeft: 0
    };
  },

  countdown() {
    if (this.state.secondsLeft > 0) {
      this.setState(() => {
        return {
          secondsLeft: this.state.secondsLeft - 1
        };
      });
    } else {
      clearInterval(this.interval);
    }
  },

  startTimer() {
    this.setState({
      secondsLeft: this.props.item.polling.seconds
    });
    this.interval = setInterval(this.countdown, 1000);
  },
  
  getTimerString() {
    const date = new Date(null);
    date.setSeconds(this.state.secondsLeft);
    return date.toISOString().substr(11, 8);
  },

  componentDidUpdate() {
    if (this.lastUpdated !== this.props.item.polling.previousUpdateTime) {
      if (defined(this.interval)) {
        clearInterval(this.interval);
      }
      this.startTimer();
      this.lastUpdated = this.props.item.polling.previousUpdateTime;
    }
  },

  componentDidMount() {
    this.startTimer();
  },

  render() {
    return (
      <div>
        <If
          condition={
            defined(this.props.item.polling) &&
            this.props.item.polling.isPolling &&
            this.props.item.polling.nextScheduledUpdateTime
          }
        >
          <div className={Styles.section}>
            <div className={Styles.timerContainer}>
              <Timer
                tooltipText={`Next data update at ${
                  this.props.item.polling.nextScheduledUpdateTime
                }`}
                radius={10}
                start={this.props.item.polling.previousUpdateTime}
                stop={this.props.item.polling.nextScheduledUpdateTime}
              />
            </div>
            <span>Next data update in {this.getTimerString()}</span>
          </div>
        </If>
      </div>
    );
  }
});

module.exports = TimerSection;
