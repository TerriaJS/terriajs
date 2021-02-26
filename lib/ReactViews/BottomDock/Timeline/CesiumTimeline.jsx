"use strict";

import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import WrappedTimeline from "terriajs-cesium/Source/Widgets/Timeline/Timeline";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import { formatDateTime, formatDate, formatTime } from "./DateFormats";
import Styles from "!style-loader!css-loader?modules&sourceMap!sass-loader?sourceMap!./cesium-timeline.scss";
import defined from "terriajs-cesium/Source/Core/defined";
import dateFormat from "dateformat";

const CesiumTimeline = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    autoPlay: PropTypes.bool
  },

  componentDidMount() {
    this.cesiumTimeline = new WrappedTimeline(
      this.timelineContainer,
      this.props.terria.clock
    );

    this.cesiumTimeline.makeLabel = time => {
      if (defined(this.props.terria.timeSeriesStack.topLayer)) {
        const layer = this.props.terria.timeSeriesStack.topLayer;
        if (defined(layer.dateFormat.timelineTic)) {
          return dateFormat(
            JulianDate.toDate(time),
            layer.dateFormat.timelineTic
          );
        }
      }
      // Adjust the label format as you zoom by using the visible timeline's start and end
      // (not the fixed this.props.terria.clock.startTime and stopTime).
      const startJulian = this.cesiumTimeline._startJulian;
      const endJulian = this.cesiumTimeline._endJulian;
      const totalDays = JulianDate.daysDifference(endJulian, startJulian);
      if (totalDays > 14) {
        return formatDate(JulianDate.toDate(time), this.locale);
      } else if (totalDays < 1) {
        return formatTime(JulianDate.toDate(time), this.locale);
      }

      return formatDateTime(JulianDate.toDate(time), this.locale);
    };

    this.cesiumTimeline.scrubFunction = e => {
      const clock = e.clock;
      clock.currentTime = e.timeJulian;
      clock.shouldAnimate = false;
      this.props.terria.currentViewer.notifyRepaintRequired();
    };

    this.cesiumTimeline.addEventListener(
      "settime",
      this.cesiumTimeline.scrubFunction,
      false
    );

    this.resizeListener = () =>
      this.cesiumTimeline && this.cesiumTimeline.resize();
    window.addEventListener("resize", this.resizeListener, false);

    this.topLayerSubscription = knockout
      .getObservable(this.props.terria.timeSeriesStack, "topLayer")
      .subscribe(() => this.zoom());
    this.zoom();
  },

  zoom() {
    this.cesiumTimeline.zoomTo(
      this.props.terria.clock.startTime,
      this.props.terria.clock.stopTime
    );
  },

  componentWillUnmount() {
    this.topLayerSubscription.dispose();
    window.removeEventListener("resize", this.resizeListener);
  },

  shouldComponentUpdate() {
    return false;
  },

  render() {
    return (
      <div
        className={Styles.cesiumTimeline}
        ref={ref => {
          this.timelineContainer = ref;
        }}
      />
    );
  }
});

module.exports = CesiumTimeline;
