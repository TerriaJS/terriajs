'use strict';

import React from 'react';

import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

const TimelineControls = React.createClass({
    propTypes: {
        clock: React.PropTypes.object.isRequired,
        analytics: React.PropTypes.object.isRequired,
        currentViewer: React.PropTypes.object.isRequired,
        locale: React.PropTypes.object
    },

    getInitialState() {

    },

    componentWillMount() {
        this.removeTickEvent = this.props.clock.onTick.addEventListener(clock => {
            const time = clock.currentTime;
            this.setState({
                currentTimeString: formatDateTime(JulianDate.toDate(time), this.props.locale)
            });
        });
    },

    componentWillUnmount() {
        this.removeTickEvent();
    },

    gotoStart() {
        this.props.analytics.logEvent('navigation', 'click', 'gotoStart');

        this.props.clock.currentTime = this.props.clock.startTime;

        this.props.currentViewer.notifyRepaintRequired();
    },

    togglePlay() {
        this.props.analytics.logEvent('navigation', 'click', 'togglePlay');

        this.props.clock.tick();
        if (this.props.clock.multiplier < 0) {
            this.props.clock.multiplier = -this.props.clock.multiplier;
        }
        this.props.clock.shouldAnimate = !this.props.clock.shouldAnimate;

        this.props.currentViewer.notifyRepaintRequired();
    },

    playSlower() {
        this.props.analytics.logEvent('navigation', 'click', 'playSlower');

        this.props.clock.tick();
        this.props.clock.multiplier /= 2;
        this.props.clock.shouldAnimate = true;

        this.props.currentViewer.notifyRepaintRequired();
    },

    playFaster() {
        this.props.analytics.logEvent('navigation', 'click', 'playFaster');

        this.props.clock.tick();
        this.props.clock.multiplier *= 2;
        this.props.clock.shouldAnimate = true;
        this.isPlaying = true;

        this.props.currentViewer.notifyRepaintRequired();
    },

    toggleLoop() {
        this.props.analytics.logEvent('navigation', 'click', 'toggleLoop');

        this.isLooping = !this.isLooping;
        if (this.isLooping) {
            this.props.clock.clockRange = ClockRange.LOOP_STOP;
        } else {
            this.props.clock.clockRange = ClockRange.UNBOUNDED;
        }

        if ((JulianDate.greaterThan(this.props.clock.startTime, this.props.clock.currentTime)) ||
            (JulianDate.lessThan(this.props.clock.stopTime, this.props.clock.currentTime))) {
            this.props.clock.currentTime = this.props.clock.startTime;
        }
    },

    render() {
        return (
            <div>
                <div class="animation-text" title="Current Time (tz info et al)">
                    <div class="animation-text-display" data-bind="text: currentTimeString"></div>
                </div>
                <div class="animation-control"
                     data-bind="event: {click: gotoStart, mousedown: function() {gotoStartActive = true;} , mouseup: function() {gotoStartActive = false;}}"
                     title="Go to beginning">
                    <div class="animation-control-icon animation-control-nofill"
                         data-bind="cesiumSvgPath: { path: svgGotoStart, width: 16, height: 16}, css: { 'animation-control-highlight': gotoStartActive }"></div>
                </div>
                <div class="animation-control" data-bind="click: togglePlay" title="Play">
                    <div class="animation-control-icon"
                         data-bind="cesiumSvgPath: { path: isPlaying ? $root.svgPause : $root.svgPlay, width: 18, height: 18}"></div>
                </div>
                <div class="animation-control"
                     data-bind="event: {click: playSlower, mousedown: function() {slowerActive = true;} , mouseup: function() {slowerActive = false;}}"
                     title="Play slower">
                    <div class="animation-control-icon animation-control-nofill"
                         data-bind="cesiumSvgPath: { path: svgSlower, width: 16, height: 16}, css: { 'animation-control-highlight': slowerActive }"></div>
                </div>
                <div class="animation-control animation-control-nofill"
                     data-bind="event: {click: playFaster, mousedown: function() {fasterActive = true;} , mouseup: function() {fasterActive = false;}}"
                     title="Play faster">
                    <div class="animation-control-icon"
                         data-bind="cesiumSvgPath: { path: svgFaster, width: 16, height: 16}, css: { 'animation-control-highlight': fasterActive }"></div>
                </div>
                <div class="animation-control animation-control-last" data-bind="click: toggleLoop"
                     title="Loop at the end">
                    <div class="animation-control-icon"
                         data-bind="cesiumSvgPath: { path: svgLoop, width: 16, height: 16}, css: { 'animation-control-active': isLooping }"></div>
                </div>
            </div>
        );
    }
});

export default TimelineControls;
