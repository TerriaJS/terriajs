'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import DateTimePicker from '../../BottomDock/Timeline/DateTimePicker';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './datetime-selector-section.scss';

const DateTimeSelectorSection = createReactClass({
    displayName: 'DateTimeSelectorSection',

    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    componentWillMount() {
        const item = this.props.item;
        this.removeTickEvent = item.terria.clock.onTick.addEventListener(clock => {
            if (!item.useOwnClock && clock.currentTime !== this.state.currentTime) {
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
        item.clock.currentTime = targetJulianDate;
        item.useOwnClock = true;
        this.setStateToCurrentTime();
        item.showDataForTime(targetJulianDate);
        item.useClock(); // Adds this item to the timeline.
        item.terria.currentViewer.notifyRepaintRequired();
    },

    renderDate(date) {
        if (!defined(date)) {
            return null;
        }
        const hour = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
        const minute = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes();
        const second = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds();
        return (
            <span className={Styles.datetime}>
                <span className={Styles.date}>{date.getUTCDate()}/{date.getUTCMonth() + 1}/{date.getUTCFullYear()}</span>,
                <span className={Styles.time}>{hour}:{minute}:{second}</span>
            </span>
        );
    },

    onTimelineButtonClicked() {
        const item = this.props.item;
        item.useOwnClock = !item.useOwnClock;
        item.useClock(); // Adds this item to the timeline.
        item.terria.clock.currentTime = item.clock.currentTime;
    },

    render() {
        const item = this.props.item;
        if (!item.canUseOwnClock || !defined(item.intervals) || !defined(item.getAvailableDates) || !defined(item.clockForDisplay)) {
            return null;
        }
        const availableDates = item.getAvailableDates();
        // The initial state often has currentTime: undefined, even though item.clockForDisplay.currentTime is available.
        const currentTime = this.state.currentTime || this.props.item.clockForDisplay.currentTime;
        const currentDate = availableDates[item.intervals.indexOf(currentTime)];

        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.title}>Imagery time:</div>
                <div className={Styles.datetimeAndPicker}>
                    {this.renderDate(currentDate)}
                    <div className={Styles.picker}>
                        <DateTimePicker name={item.name} currentDate={currentDate} dates={availableDates} onChange={this.changeDateTime} />
                    </div>
                </div>
                <button className={classNames(Styles.timelineButton, {[Styles.timelineActive]: !item.useOwnClock})} type='button' onClick={this.onTimelineButtonClicked}>
                    Timeline
                </button>
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
