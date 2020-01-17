"use strict";

import dateFormat from "dateformat";

import React from "react";
import createReactClass from "create-react-class";
import classNames from "classnames";
import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

import DateTimePicker from "../../BottomDock/Timeline/DateTimePicker";
import ObserveModelMixin from "../../ObserveModelMixin";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import { withTranslation } from "react-i18next";

import Styles from "./datetime-selector-section.scss";
import Icon from "../../Icon.jsx";

const DateTimeSelectorSection = createReactClass({
  displayName: "DateTimeSelectorSection",

  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isOpen: false
    };
  },

  changeDateTime(time) {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timeSeriesStack.promoteLayerToTop(item);

    // Set the time on the item, set it to use its own clock, update the imagery and repaint.
    item.currentTime = JulianDate.fromDate(new Date(time));
    item.terria.currentViewer.notifyRepaintRequired();
  },

  onTimelineButtonClicked() {
    const item = this.props.item;
    item.useOwnClock = !item.useOwnClock;
    item.useClock(); // Adds this item to the timeline.
    item.terria.currentViewer.notifyRepaintRequired();
  },

  onShowOnChartButtonClicked() {
    const item = this.props.item;
    item.showOnChart = !item.showOnChart;
  },

  onPreviousButtonClicked() {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timeSeriesStack.promoteLayerToTop(item);

    item.moveToPreviousTime();

    // Repaint imagery on layers that don't subscribe to clock changes.
    item.terria.currentViewer.notifyRepaintRequired();
  },

  onNextButtonClicked() {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timeSeriesStack.promoteLayerToTop(item);

    item.moveToNextTime();

    // Repaint imagery on layers that don't subscribe to clock changes.
    item.terria.currentViewer.notifyRepaintRequired();
  },

  onOpen() {
    this.setState({
      isOpen: true
    });
  },

  onClose() {
    this.setState({
      isOpen: false
    });
  },

  toggleOpen(event) {
    this.setState({
      isOpen: !this.state.isOpen
    });
    event.stopPropagation();
  },

  render() {
    const { t } = this.props;
    let discreteTime;
    let format;
    const item = this.props.item;

    if (defined(item.discreteTime)) {
      const time = item.discreteTime;
      if (defined(item.dateFormat.currentTime)) {
        format = item.dateFormat;
        discreteTime = dateFormat(time, item.dateFormat.currentTime);
      } else {
        discreteTime = formatDateTime(time);
      }
    }

    // We explicitly check that the item has a .clock defined as some layers may have .availableDates but are unable to be
    // set to a specific date or shown on the timeline (layers that have timeseries chart data are one instance of this).
    if (
      !defined(item.clock) ||
      !defined(item.availableDates) ||
      item.availableDates.length === 0
    ) {
      return null;
    }
    return (
      <div className={Styles.datetimeSelector}>
        <div className={Styles.title}>Time:</div>
        <div className={Styles.datetimeSelectorInner}>
          <div className={Styles.datetimeAndPicker}>
            <button
              className={Styles.datetimePrevious}
              disabled={!item.isPreviousTimeAvaliable()}
              onClick={this.onPreviousButtonClicked}
              title={t("dateTime.previous")}
            >
              <Icon glyph={Icon.GLYPHS.previous} />
            </button>
            <button
              className={Styles.currentDate}
              onClick={this.toggleOpen}
              title={t("dateTime.selectTime")}
            >
              {defined(discreteTime) ? discreteTime : t("dateTime.outOfRange")}
            </button>
            <button
              className={Styles.datetimeNext}
              disabled={!item.isNextTimeAvaliable()}
              onClick={this.onNextButtonClicked}
              title={t("dateTime.next")}
            >
              <Icon glyph={Icon.GLYPHS.next} />
            </button>
          </div>
          <div className={Styles.picker} title={t("dateTime.selectTime")}>
            <DateTimePicker
              currentDate={item.clampedDiscreteTime}
              dates={item.availableDates}
              onChange={this.changeDateTime}
              openDirection="down"
              isOpen={this.state.isOpen}
              showCalendarButton={false}
              onOpen={this.onOpen}
              onClose={this.onClose}
              dateFormat={format}
            />
          </div>
          <button
            className={classNames(Styles.timelineButton, {
              [Styles.timelineActive]: !item.useOwnClock
            })}
            type="button"
            onClick={this.onTimelineButtonClicked}
            title={t("dateTime.useTimeline")}
          >
            <Icon glyph={Icon.GLYPHS.timeline} />
          </button>
          <button
            className={classNames(Styles.timelineButton, {
              [Styles.timelineActive]: item.showOnChart
            })}
            type="button"
            onClick={this.onShowOnChartButtonClicked}
            title={t("dateTime.availableTimeChart")}
          >
            <Icon glyph={Icon.GLYPHS.lineChart} />
          </button>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(DateTimeSelectorSection);
