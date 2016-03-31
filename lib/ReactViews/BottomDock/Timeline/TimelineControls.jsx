'use strict';

import React from 'react';

import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
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
                <button type='button' className="btn btn--timeline-control" onClick={this.gotoStart} title="Go to beginning">
                    <i className='icon icon-backToStart' />
                </button>
                <button type='button' className='btn btn--timeline-control' onClick={this.togglePlay} title="Play">
                    <i className={classnames('icon', {'icon-pause': this.isPlaying(), 'icon-play': !this.isPlaying()})} />
                </button>
                <button type='button' className="btn btn--timeline-control" onClick={this.playSlower} title="Play Slower">
                    <i className='icon icon-backward' />
                </button>
                <button type='button' className="btn btn--timeline-control" onClick={this.playFaster} title="Play Faster">
                    <i className='icon icon-forward' />
                </button>
                <button type='button' className={classnames('btn', 'btn--timeline-control', {'is-active': this.isLooping()})}
                        onClick={this.toggleLoop} title="Loop at the end">
                    <i className='icon icon-refresh' />
                </button>
            </div>
        );
    }
});

export default TimelineControls;
