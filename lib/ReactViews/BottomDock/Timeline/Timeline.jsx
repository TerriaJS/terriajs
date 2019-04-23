'use strict';

import createReactClass from 'create-react-class';
import dateFormat from 'dateformat';
import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import TimelineControls from './TimelineControls';
import CesiumTimeline from './CesiumTimeline';
import DateTimePicker from './DateTimePicker';
import {formatDateTime} from './DateFormats';

import Styles from './timeline.scss';

const Timeline = observer(createReactClass({
    displayName: 'Timeline',

    propTypes: {
        terria: PropTypes.object.isRequired,
        locale: PropTypes.object
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
        this.resizeListener = () => this.timeline && this.timeline.resize();
        window.addEventListener('resize', this.resizeListener, false);
    },

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeListener);
    },

    changeDateTime(time) {
        this.props.terria.clock.currentTime = JulianDate.fromDate(new Date(time));
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const terria = this.props.terria;
        const catalogItem = terria.timeSeriesStack.topLayer;
        if (!defined(catalogItem)) {
            return null;
        }

        const jsDate = JulianDate.toDate(catalogItem.currentTimeAsJulianDate);
        const timeSeriesStack = this.props.terria.timeSeriesStack;
        let currentTime;
        if (defined(timeSeriesStack.topLayer) && defined(timeSeriesStack.topLayer.dateFormat) && defined(timeSeriesStack.topLayer.dateFormat.currentTime)) {
            currentTime = dateFormat(jsDate, this.props.terria.timeSeriesStack.topLayer.dateFormat.currentTime);
        } else {
            currentTime = formatDateTime(jsDate, this.props.locale);
        }

        const discreteTimes = catalogItem.discreteTimesAsSortedJulianDates;
        const currentDiscreteJulianDate = catalogItem.currentDiscreteJulianDate;

        return (
            <div className={Styles.timeline}>
                <div className={Styles.textRow}>
                    <div className={Styles.textCell} title="Name of the dataset whose time range is shown">{catalogItem.name} {currentTime}</div>
                </div>
                <div className={Styles.controlsRow}>
                    <TimelineControls clock={terria.clock} analytics={terria.analytics} currentViewer={terria.currentViewer} />
                    <If condition={defined(discreteTimes) && discreteTimes.length !== 0 && defined(currentDiscreteJulianDate)}>
                        <DateTimePicker currentDate={JulianDate.toDate(currentDiscreteJulianDate)} dates={discreteTimes.map(time => JulianDate.toDate(time))} onChange={this.changeDateTime} openDirection='up'/>
                    </If>
                    <CesiumTimeline terria={terria} />
                </div>
            </div>
        );
    }
}));

module.exports = Timeline;
