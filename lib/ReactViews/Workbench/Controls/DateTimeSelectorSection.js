'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

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
        if (!item.showDatetimePicker || !defined(item.intervals)) {
            return null;
        }
        const datetimes = this.getDateTimes();
        if (!defined(datetimes) || datetimes.length < 2) {
            return null;
        }

        const label = 'Freeze at:';
        const currentTime = defined(this.state.currentTime) ? this.state.currentTime : item.clock.currentTime;
        const currentIntervalIndex = item.intervals.indexOf(currentTime);
        return (
            <div className={Styles.datetimeSelector}>
                <label className={Styles.title} htmlFor={item.name}>{label}</label>
                <select className={Styles.field} name={item.name} value={currentIntervalIndex} onChange={this.changeDateTime}>
                    {datetimes.map((title, index) => <option key={index} value={index}>{title}</option>)}
                </select>
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
