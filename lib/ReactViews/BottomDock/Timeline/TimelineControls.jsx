'use strict';

import React from 'react';

import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import classnames from 'classnames';

const TimelineControls = React.createClass({
    propTypes: {
        clock: React.PropTypes.object.isRequired,
        analytics: React.PropTypes.object.isRequired,
        currentViewer: React.PropTypes.object.isRequired,
        locale: React.PropTypes.object
    },

    getInitialState() {
        return {
            currentTimeString: ''
        };
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

        this.props.currentViewer.notifyRepaintRequired();
    },

    toggleLoop() {
        this.props.analytics.logEvent('navigation', 'click', 'toggleLoop');

        if (this.isLooping()) {
            this.props.clock.clockRange = ClockRange.CLAMPED;
        } else {
            this.props.clock.clockRange = ClockRange.LOOP_STOP;
        }
    },

    isLooping() {
        return this.props.clock.clockRange === ClockRange.LOOP_STOP;
    },

    isPlaying() {
        return this.props.clock.shouldAnimate;
    },

    render() {
        return (
            <div className="timeline__controls">
                <button className="btn btn--timeline-control" onClick={this.gotoStart} title="Go to beginning">
                    B
                </button>
                <button
                    className={classnames('btn', 'btn--timeline-control', {'btn--play': this.isPlaying(), 'btn--pause': !this.isPlaying()})}
                    onClick={this.togglePlay} title="Play"/>
                <button className="btn btn--timeline-control" onClick={this.playSlower} title="Play Slower">
                    S
                </button>
                <button className="btn btn--timeline-control" onClick={this.playFaster} title="Play Faster">
                    F
                </button>
                <button className={classnames('btn', 'btn--timeline-control', {'is-active': this.isLooping()})}
                        onClick={this.toggleLoop} title="Loop at the end">
                    L
                </button>
            </div>
        );
    }
});

export default TimelineControls;
