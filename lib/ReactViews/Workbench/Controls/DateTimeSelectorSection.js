'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
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

    getInitialState() {
        return {
            currentTime: this.props.item.clock && this.props.item.clock.currentTime
        };
    },

    getDateTimes() {
        const item = this.props.item;
        const datetimes = [];
        // Only show the start of each interval. If only time instants were given, this is the instant.
        for (let i = 0; i < item.intervals.length; i++) {
            datetimes.push(JulianDate.toIso8601(item.intervals.get(i).start));
        }
        return datetimes;
    },

    changeDateTime(event) {
        const item = this.props.item;
        item.clock.currentTime = item.intervals.get(event.target.value).start;
        item.showDataForTime(item.clock.currentTime);
        this.setState({currentTime: item.clock.currentTime});
        item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const item = this.props.item;
        if (!item.useOwnClock || !defined(item.intervals) || !defined(item.getAvailableDates)) {
            return null;
        }
        const availableDates = item.getAvailableDates();
        const currentDate = availableDates[item.intervals.indexOf(item.clock.currentTime)];

        const label = 'Freeze at:';
        return (
            <div className={Styles.datetimeSelector}>
                <DateTimePicker name={item.name} currentDate={currentDate} dates={availableDates} onChange={this.changeDateTime} />
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
