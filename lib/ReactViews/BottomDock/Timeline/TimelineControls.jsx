"use strict";

import React from "react";

import PropTypes from "prop-types";
import createReactClass from "create-react-class";

import ClockRange from "terriajs-cesium/Source/Core/ClockRange";
import Styles from "./timeline-controls.scss";
import Icon from "../../Icon";

const TimelineControls = createReactClass({
  propTypes: {
    clock: PropTypes.object.isRequired,
    analytics: PropTypes.object.isRequired,
    currentViewer: PropTypes.object.isRequired,
    locale: PropTypes.object
  },

  getInitialState() {
    return {
      currentTimeString: ""
    };
  },

  gotoStart() {
    this.props.analytics.logEvent("navigation", "click", "gotoStart");

    this.props.clock.currentTime = this.props.clock.startTime;

    this.props.currentViewer.notifyRepaintRequired();
  },

  togglePlay() {
    this.props.analytics.logEvent("navigation", "click", "togglePlay");

    this.props.clock.tick();
    if (this.props.clock.multiplier < 0) {
      this.props.clock.multiplier = -this.props.clock.multiplier;
    }
    this.props.clock.shouldAnimate = !this.props.clock.shouldAnimate;

    this.props.currentViewer.notifyRepaintRequired();
  },

  playSlower() {
    this.props.analytics.logEvent("navigation", "click", "playSlower");

    this.props.clock.tick();
    this.props.clock.multiplier /= 2;
    this.props.clock.shouldAnimate = true;

    this.props.currentViewer.notifyRepaintRequired();
  },

  playFaster() {
    this.props.analytics.logEvent("navigation", "click", "playFaster");

    this.props.clock.tick();
    this.props.clock.multiplier *= 2;
    this.props.clock.shouldAnimate = true;

    this.props.currentViewer.notifyRepaintRequired();
  },

  toggleLoop() {
    this.props.analytics.logEvent("navigation", "click", "toggleLoop");

    if (this.isLooping()) {
      this.props.clock.clockRange = ClockRange.CLAMPED;
    } else {
      this.props.clock.clockRange = ClockRange.LOOP_STOP;
    }
  },

  isLooping() {
    return this.props.clock.clockRange === ClockRange.LOOP_STOP;
  },

  isPlaying() {
    return this.props.clock.shouldAnimate;
  },

  render() {
    return (
      <div className={Styles.controls}>
        <button
          type="button"
          className={Styles.timelineControl}
          onClick={this.gotoStart}
          title="Go to beginning"
        >
          <Icon glyph={Icon.GLYPHS.backToStart} />
        </button>
        <button
          type="button"
          className={Styles.timelineControl}
          onClick={this.togglePlay}
          title="Play"
        >
          {this.isPlaying() ? (
            <Icon glyph={Icon.GLYPHS.pause} />
          ) : (
            <Icon glyph={Icon.GLYPHS.play} />
          )}
        </button>
        <button
          type="button"
          className={Styles.timelineControl}
          onClick={this.playSlower}
          title="Play Slower"
        >
          <Icon glyph={Icon.GLYPHS.backward} />
        </button>
        <button
          type="button"
          className={Styles.timelineControl}
          onClick={this.playFaster}
          title="Play Faster"
        >
          <Icon glyph={Icon.GLYPHS.forward} />
        </button>
      </div>
    );
  }
});

export default TimelineControls;
