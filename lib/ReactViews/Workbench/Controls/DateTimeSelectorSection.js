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

    onNextButtonClicked() {
        const index = this.nextIndex();
        this.updateIndex(index);
    },

    onPreviousButtonClicked() {
        const index = this.previousIndex();
        this.updateIndex(index);
    },

    getCurrentTime() {
        // Note: Don't need to check these are defined as this is a precondition of calling this function.
        // The initial state often has currentTime: undefined, even though item.clockForDisplay.currentTime is available.
        return this.state.currentTime || this.props.item.clockForDisplay.currentTime;
    },

    getCurrentIndex() {
        // Note: Don't need to check these are defined as this is a precondition of calling this function.
        return this.props.item.intervals.indexOf(this.getCurrentTime());
    },

    nextIndex() {
        const index = this.getCurrentIndex();
        if(defined(index) && (index < (this.props.item.intervals.length-1))) {
            return index + 1;
        }

        return undefined;
    },

    previousIndex() {
        const index = this.getCurrentIndex();
        if(defined(index) && (index > 0)) {
            return index - 1;
        }

        return undefined;
    },

    updateIndex (value) {
        if (defined(value)) {
            const currentDate = this.props.item.availableDates[value];

            this.changeDateTime(currentDate);
        }
    },

    render() {
        const item = this.props.item;
        if (!item.canUseOwnClock || !defined(item.intervals) || item.intervals.length === 0 || !defined(item.clockForDisplay)) {
            return null;
        }
        const availableDates = item.availableDates;
        const currentDate = availableDates[this.getCurrentIndex()];
        const nextAvaliable = defined(this.nextIndex());
        const previousAvaliable = defined(this.previousIndex());
        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.title}>Time:</div>
                <div className={Styles.datetimeAndPicker}>
                    <span className={Styles.currentDate}>{defined(currentDate) && formatDateTime(currentDate)}</span>
                    <div>
                        <button className={classNames(Styles.timelineButton, {[Styles.timelineActive]: !previousAvaliable})} type='button' onClick={this.onNextButtonClicked}>
                            Next
                        </button>
                        <button className={classNames(Styles.timelineButton, {[Styles.timelineActive]: !nextAvaliable})} type='button' onClick={this.onPreviousButtonClicked}>
                            Previous
                        </button>
                    </div>
                    <div className={Styles.picker}>
                        <CatalogItemDateTimePicker item={item} currentTime={this.getCurrentTime()} onChange={this.changeDateTime} openDirection='down'/>
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
