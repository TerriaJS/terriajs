'use strict';

import React from 'react';
import AnimationViewModel from '../../ViewModels/AnimationViewModel';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import WrappedTimeline from 'terriajs-cesium/Source/Widgets/Timeline/Timeline';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import {formatDateTime, formatDate, formatTime} from './DateFormats';

const CesiumTimeline = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        autoPlay: React.PropTypes.bool
    },

    componentDidMount() {
        this.cesiumTimeline = new WrappedTimeline(this.timelineContainer, this.props.terria.clock);

        this.cesiumTimeline.makeLabel = time => {
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
        this.cesiumTimeline.zoomTo(this.props.terria.clock.startTime, this.props.terria.clock.stopTime);
    },

    shouldComponentUpdate() {
        return false;
    },

    render() {
        return (
            <div className="timeline__cesium-timeline" ref={ref => this.timelineContainer = ref} />
        );
    }
});

module.exports = CesiumTimeline;
