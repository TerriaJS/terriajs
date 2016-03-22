'use strict';

import React from 'react';

import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';

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
            <div className="timeline__controls">
                <button className="" onClick={this.gotoStart} title="Go to beginning">
                    START
                </button>
                <button className="" onClick={this.togglePlay} title="Play">
                    PLAY
                </button>
                <button className="" onClick={this.playSlower} title="Play Slower">
                    SLOW
                </button>
                <button className="" onClick={this.playFaster} title="Play Faster">
                    FAST
                </button>
                <button className="" onClick={this.toggleLoop} title="Loop at the end">
                    LOOP
                </button>
            </div>
        );
    }
});

export default TimelineControls;
