'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import WrappedTimeline from 'terriajs-cesium/Source/Widgets/Timeline/Timeline';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import {formatDateTime, formatDate, formatTime} from './DateFormats';
import Styles from '!style-loader!css-loader?modules&sourceMap!sass-loader?sourceMap!./cesium-timeline.scss';
import defined from 'terriajs-cesium/Source/Core/defined';
import dateFormat from 'dateformat';

const CesiumTimeline = React.createClass({
    propTypes: {
        terria: PropTypes.object.isRequired,
        autoPlay: PropTypes.bool
    },

    componentDidMount() {
        this.cesiumTimeline = new WrappedTimeline(this.timelineContainer, this.props.terria.clock);

        this.cesiumTimeline.makeLabel = time => {
            if (defined(this.props.terria.timeSeriesStack.topLayer)) {
                const layer = this.props.terria.timeSeriesStack.topLayer;
                if (defined(layer.dateFormat.timelineTic)) {
                    return dateFormat(JulianDate.toDate(time), layer.dateFormat.timelineTic);
                }
            }

            const totalDays = JulianDate.daysDifference(this.props.terria.clock.stopTime, this.props.terria.clock.startTime);
            if (totalDays > 14) {
                return formatDate(JulianDate.toDate(time), this.locale);
            } else if (totalDays < 1) {
                return formatTime(JulianDate.toDate(time), this.locale);
            }

            return formatDateTime(JulianDate.toDate(time), this.locale);
        };

        this.cesiumTimeline.scrubFunction = e => {
            const clock = e.clock;
            clock.currentTime = e.timeJulian;
            clock.shouldAnimate = false;
            this.props.terria.currentViewer.notifyRepaintRequired();
        };

        this.cesiumTimeline.addEventListener('settime', this.cesiumTimeline.scrubFunction, false);

        this.topLayerSubscription = knockout.getObservable(this.props.terria.timeSeriesStack, 'topLayer').subscribe(() => this.zoom());
        this.zoom();
    },

    zoom() {
        this.cesiumTimeline.zoomTo(this.props.terria.clock.startTime, this.props.terria.clock.stopTime);
    },

    componentWillUnmount() {
        this.topLayerSubscription.dispose();
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
