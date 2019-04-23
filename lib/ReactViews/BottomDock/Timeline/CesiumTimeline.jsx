'use strict';

import Styles from '!style-loader!css-loader?modules&sourceMap!sass-loader?sourceMap!./cesium-timeline.scss';
import createReactClass from 'create-react-class';
import dateFormat from 'dateformat';
import { autorun, runInAction } from 'mobx';
import PropTypes from 'prop-types';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import WrappedTimeline from 'terriajs-cesium/Source/Widgets/Timeline/Timeline';
import CommonStrata from '../../../Models/CommonStrata';
import { formatDate, formatDateTime, formatTime } from './DateFormats';

const CesiumTimeline = createReactClass({
    propTypes: {
        terria: PropTypes.object.isRequired
    },

    componentDidMount() {
        this.cesiumTimeline = new WrappedTimeline(this.timelineContainer, this.props.terria.clock);

        this.cesiumTimeline.makeLabel = time => {
            if (defined(this.props.terria.timeSeriesStack.topLayer)) {
                const layer = this.props.terria.timeSeriesStack.topLayer;
                if (defined(layer.dateFormat) && defined(layer.dateFormat.timelineTic)) {
                    return dateFormat(JulianDate.toDate(time), layer.dateFormat.timelineTic);
                }
            }
            // Adjust the label format as you zoom by using the visible timeline's start and end
            // (not the fixed this.props.terria.clock.startTime and stopTime).
            const startJulian = this.cesiumTimeline._startJulian;
            const endJulian = this.cesiumTimeline._endJulian;
            const totalDays = JulianDate.daysDifference(endJulian, startJulian);
            if (totalDays > 14) {
                return formatDate(JulianDate.toDate(time), this.locale);
            } else if (totalDays < 1) {
                return formatTime(JulianDate.toDate(time), this.locale);
            }

            return formatDateTime(JulianDate.toDate(time), this.locale);
        };

        this.cesiumTimeline.addEventListener('settime', e => {
            const clock = e.clock;
            clock.currentTime = e.timeJulian;
            clock.shouldAnimate = false;
            const timeSeriesStack = this.props.terria.timeSeriesStack;
            if (timeSeriesStack.topLayer) {
                runInAction(() => {
                    timeSeriesStack.topLayer.setTrait(CommonStrata.user, 'isPaused', true);
                    timeSeriesStack.syncLayersToClockCurrentTime(CommonStrata.user);
                });
            }
            this.props.terria.currentViewer.notifyRepaintRequired();
        }, false);

        this.disposeZoomAutorun = autorun(() => {
            const timeSeriesStack = this.props.terria.timeSeriesStack;
            const topLayer = timeSeriesStack.topLayer;
            if (topLayer) {
                this.cesiumTimeline.zoomTo(topLayer.startTimeAsJulianDate, topLayer.stopTimeAsJulianDate);
            }
        });
    },

    componentWillUnmount() {
        this.disposeZoomAutorun();
    },

    shouldComponentUpdate() {
        return false;
    },

    render() {
        return (
            <div className={Styles.cesiumTimeline} ref={ref => {this.timelineContainer = ref;}} />
        );
    }
});

module.exports = CesiumTimeline;
