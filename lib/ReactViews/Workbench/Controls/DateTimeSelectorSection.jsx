"use strict";

import dateFormat from "dateformat";

import React from "react";
import createReactClass from "create-react-class";
import classNames from "classnames";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

import DateTimePicker from "../../BottomDock/Timeline/DateTimePicker";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import Styles from "./datetime-selector-section.scss";
import Icon from "../../Icon";
import CommonStrata from "../../../Models/CommonStrata";
import { runInAction } from "mobx";

const DateTimeSelectorSection = observer(
  createReactClass({
    displayName: "DateTimeSelectorSection",

    propTypes: {
      item: PropTypes.object.isRequired
    },

    getInitialState() {
      return {
        isOpen: false
      };
    },

    changeDateTime(time) {
      const item = this.props.item;

      // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
      item.terria.timelineStack.promoteToTop(item);

      runInAction(() => {
        // Set the time on the item, set it to use its own clock, update the imagery and repaint.
        item.setTrait(
          CommonStrata.user,
          "currentTime",
          JulianDate.toIso8601(JulianDate.fromDate(time))
        );
      });
      item.terria.currentViewer.notifyRepaintRequired();
    },

    onTimelineButtonClicked() {
      const item = this.props.item;
      const terria = item.terria;
      if (terria.timelineStack.items.indexOf(item) >= 0) {
        terria.timelineStack.remove(item);
      } else {
        terria.timelineStack.addToTop(item);
      }
      item.terria.currentViewer.notifyRepaintRequired();
    },

    onShowOnChartButtonClicked() {
      const item = this.props.item;
      item.showOnChart = !item.showOnChart;
    },

    onPreviousButtonClicked() {
      const item = this.props.item;

      // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
      item.terria.timelineStack.promoteToTop(item);

      item.moveToPreviousDiscreteTime(CommonStrata.user);

      // Repaint imagery on layers that don't subscribe to clock changes.
      item.terria.currentViewer.notifyRepaintRequired();
    },

    onNextButtonClicked() {
      const item = this.props.item;

      // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
      item.terria.timelineStack.promoteToTop(item);

      item.moveToNextDiscreteTime(CommonStrata.user);

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
      let discreteTime;
      let format;
      const item = this.props.item;
      const discreteTimes = item.discreteTimesAsSortedJulianDates;

      if (!defined(discreteTimes) || discreteTimes.length === 0) {
        return null;
      }

      if (defined(item.currentDiscreteJulianDate)) {
        const time = JulianDate.toDate(item.currentDiscreteJulianDate);
        if (defined(item.dateFormat) && defined(item.dateFormat.currentTime)) {
          format = item.dateFormat;
          discreteTime = dateFormat(time, item.dateFormat.currentTime);
        } else {
          discreteTime = formatDateTime(time);
        }
      }

      const jsDates = discreteTimes.map(timeTrait =>
        JulianDate.toDate(timeTrait.time)
      );
      const attachedToTimeline = item.terria.timelineStack.contains(item);

      return (
        <div className={Styles.datetimeSelector}>
          <div className={Styles.title}>Time:</div>
          <div className={Styles.datetimeSelectorInner}>
            <div className={Styles.datetimeAndPicker}>
              <button
                className={Styles.datetimePrevious}
                disabled={!item.isPreviousDiscreteTimeAvailable}
                onClick={this.onPreviousButtonClicked}
                title="Previous time"
              >
                <Icon glyph={Icon.GLYPHS.previous} />
              </button>
              <button
                className={Styles.currentDate}
                onClick={this.toggleOpen}
                title="Select a time"
              >
                {defined(discreteTime)
                  ? discreteTime
                  : "Currently out of range."}
              </button>
              <button
                className={Styles.datetimeNext}
                disabled={!item.isNextDiscreteTimeAvailable}
                onClick={this.onNextButtonClicked}
                title="Next time"
              >
                <Icon glyph={Icon.GLYPHS.next} />
              </button>
            </div>
            <div className={Styles.picker} title="Select a time">
              <DateTimePicker
                currentDate={
                  item.currentDiscreteJulianDate === undefined
                    ? undefined
                    : JulianDate.toDate(item.currentDiscreteJulianDate)
                }
                dates={jsDates}
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
                [Styles.timelineActive]: attachedToTimeline
              })}
              type="button"
              onClick={this.onTimelineButtonClicked}
              title="Use timeline"
            >
              <Icon glyph={Icon.GLYPHS.timeline} />
            </button>
            <button
              className={classNames(Styles.timelineButton, {
                [Styles.timelineActive]: item.showOnChart
              })}
              type="button"
              onClick={this.onShowOnChartButtonClicked}
              title="Show available times on chart"
            >
              <Icon glyph={Icon.GLYPHS.lineChart} />
            </button>
          </div>
        </div>
      );
    }
  })
);

module.exports = DateTimeSelectorSection;
