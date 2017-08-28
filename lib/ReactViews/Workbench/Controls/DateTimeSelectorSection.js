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

    changeDateTime(time) {
        const item = this.props.item;
        const targetJulianDate = JulianDate.fromDate(new Date(time));
        item.clock.currentTime = targetJulianDate;
        item.showDataForTime(targetJulianDate);
        this.setState({currentTime: targetJulianDate});
        item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const item = this.props.item;
        if (!item.useOwnClock || !defined(item.intervals) || !defined(item.getAvailableDates)) {
            return null;
        }
        const availableDates = item.getAvailableDates();
        const currentDate = availableDates[item.intervals.indexOf(item.clock.currentTime)];

        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.freezeAt}>Freeze at:</div>
                <DateTimePicker name={item.name} currentDate={currentDate} dates={availableDates} onChange={this.changeDateTime} />
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
