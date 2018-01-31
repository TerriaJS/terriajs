'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import classNames from 'classnames';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
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
        const that = this;
        const item = this.props.item;

        that._clockSubscription = knockout.getObservable(item, 'clock').subscribe(function() {
            that.updateClockWatcher();
        }, this);
        this.updateClockWatcher();
    },

    componentWillUnmount() {
        if (defined(this._clockSubscription)) {
            this._clockSubscription.dispose();
            this._clockSubscription = undefined;
        }
        this.removeClockSubscription();
    },

    /**
     * Since item.clockForDisplay.currentTime isn't knockout observable we manually subscribe to item.clock state changes and force the component to update.
     *
     * This function removes old unneeded change subscriptions and creates new subscriptions on the current item.clock.
     */
    updateClockWatcher() {
        const item = this.props.item;

        // Remove any old subscriptions.
        this.removeClockSubscription();

        if (defined(item.clock)) {
            const that = this;
            this._removeClockChanged = item.clock.definitionChanged.addEventListener(function () {
                that.forceUpdate();
            });
        }
    },

    /**
     * Removes an item.clock.definitionChanged subscriptions.
     */
    removeClockSubscription() {
        if (defined(this._removeClockChanged)) {
            this._removeClockChanged();
            this._removeClockChanged = undefined;
        }
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

    render() {
        const item = this.props.item;
        if (!item.canUseOwnClock || !defined(item.intervals) || item.intervals.length === 0 || !defined(item.clockForDisplay)) {
            return null;
        }
        const availableDates = item.availableDates;
        // The initial state often has currentTime: undefined, even though item.clockForDisplay.currentTime is available.
        const currentTime = item.clockForDisplay.currentTime;
        const currentDate = availableDates[item.intervals.indexOf(currentTime)];
        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.title}>Time:</div>
                <div className={Styles.datetimeAndPicker}>
                    <span className={Styles.currentDate}>{defined(currentDate) && formatDateTime(currentDate)}</span>
                    <div className={Styles.picker}>
                        <CatalogItemDateTimePicker item={item} currentTime={currentTime} onChange={this.changeDateTime} openDirection='down'/>
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
