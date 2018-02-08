'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import CatalogItemDateTimePicker from '../../BottomDock/Timeline/CatalogItemDateTimePicker';
import ObserveModelMixin from '../../ObserveModelMixin';
import {formatDateTime} from '../../BottomDock/Timeline/DateFormats';
import Styles from './datetime-selector-section.scss';
import Icon from '../../Icon.jsx';

const DateTimeSelectorSection = createReactClass({
    displayName: 'DateTimeSelectorSection',

    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    componentWillMount() {
        const item = this.props.item;
        this.removeTickEvent = item.terria.clock.onTick.addEventListener(clock => {
            if (!item.useOwnClock && !JulianDate.equals(clock.currentTime, this.state.currentTime)) {
                this.setStateToCurrentTime();
            }
        });
    },

    componentWillUnmount() {
        this.removeTickEvent();
    },

    setStateToCurrentTime() {
        this.setState(this.getInitialState());
    },

    getInitialState() {
        return {
            currentTime: this.props.item.clockForDisplay && this.props.item.clockForDisplay.currentTime
        };
    },

    changeDateTime(time) {
        // Set the time on the item, set it to use its own clock, update the imagery and repaint.
        const item = this.props.item;
        const targetJulianDate = JulianDate.fromDate(new Date(time));
        item.useOwnClock = true;  // A side-effect of setting useOwnClock is it sets the time to the timeline time.
        item.clock.currentTime = targetJulianDate;  // So update the clock's time afterwards.
        this.setStateToCurrentTime();
        item.showDataForTime(targetJulianDate);
        item.useClock(); // Adds this item to the timeline.
        item.terria.currentViewer.notifyRepaintRequired();
    },

    onTimelineButtonClicked() {
        const item = this.props.item;
        item.useOwnClock = !item.useOwnClock;
        item.useClock(); // Adds this item to the timeline.
        item.terria.currentViewer.notifyRepaintRequired();
    },

    goToPreviousDate(availableDates, currentIndex) {
      const nextDate = availableDates[currentIndex - 1];
      this.changeDateTime(nextDate);
    },

    goToNextDate(availableDates, currentIndex) {
      const nextDate = availableDates[currentIndex + 1];
      this.changeDateTime(nextDate);
    },

    render() {
        const item = this.props.item;
        if (!item.canUseOwnClock || !defined(item.intervals) || item.intervals.length === 0 || !defined(item.clockForDisplay)) {
            return null;
        }
        const availableDates = item.availableDates;
        // The initial state often has currentTime: undefined, even though item.clockForDisplay.currentTime is available.
        const currentTime = this.state.currentTime || item.clockForDisplay.currentTime;
        const currentIndex = item.intervals.indexOf(currentTime);
        const currentDate = availableDates[currentIndex];

        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.title}>Time:</div>
                <div className={Styles.datetimeSelectorInner}>
                  <div className={Styles.datetimeAndPicker}>
                      <button className={Styles.datetimePrevious} disabled={currentIndex === 0} onClick={this.goToPreviousDate.bind(this, availableDates, currentIndex)}><Icon glyph={Icon.GLYPHS.prev}/></button>
                      <span className={Styles.currentDate}>{defined(currentDate) && formatDateTime(currentDate)}</span>
                      <button className={Styles.datetimeNext} disabled={currentIndex === availableDates.length - 1} onClick={this.goToNextDate.bind(this, availableDates, currentIndex)}><Icon glyph={Icon.GLYPHS.next}/></button>
                  </div>
                  <div className={Styles.picker}>
                      <CatalogItemDateTimePicker item={item} currentTime={currentTime} onChange={this.changeDateTime} openDirection='down'/>
                  </div>
                  <button className={classNames(Styles.timelineButton, {[Styles.timelineActive]: !item.useOwnClock})} type='button' onClick={this.onTimelineButtonClicked}>
                      <Icon glyph={Icon.GLYPHS.timeline}/>
                  </button>
                </div>
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
