'use strict';

import React from 'react';
import AnimationViewModel from '../../ViewModels/AnimationViewModel';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import CesiumTimeline from 'terriajs-cesium/Source/Widgets/Timeline';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

const Timeline = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        autoPlay: React.PropTypes.bool
    },

    getInitialState() {

    },

    componentWillMount() {
        this.cesiumTimeline = new CesiumTimeline(this.timelineContainer, this.props.terria.clock);

        this.cesiumTimeline.makeLabel = function(time) {
            const totalDays = JulianDate.daysDifference(this.props.terria.clock.stopTime, this.props.terria.clock.startTime);
            if (totalDays > 14) {
                return formatDate(JulianDate.toDate(time), this.locale);
            } else if (totalDays < 1) {
                return formatTime(JulianDate.toDate(time), this.locale);
            }

            return formatDateTime(JulianDate.toDate(time), this.locale);
        };

        this.cesiumTimeline.scrubFunction = function(e) {
            const clock = e.clock;
            clock.currentTime = e.timeJulian;
            clock.shouldAnimate = false;
            this.props.terria.currentViewer.notifyRepaintRequired();
        };

        this.cesiumTimeline.addEventListener('settime', this.cesiumTimeline.scrubFunction, false);
        this.cesiumTimeline.zoomTo(this.terria.clock.startTime, this.terria.clock.stopTime);
    },

    render() {
        return (
            <div class="animation-timeline" ref={ref => this.timelineContainer = ref} />
        );
    }
});

module.exports = Timeline;
