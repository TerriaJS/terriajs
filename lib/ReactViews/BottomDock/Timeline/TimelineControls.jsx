'use strict';

import React from 'react';

import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
import classnames from 'classnames';
import Styles from './timeline-controls.scss';

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
            <div className={Styles.controls}>
                <button type='button' className={Styles.timelineControl} onClick={this.gotoStart} title="Go to beginning">
                    <i className={Styles.iconBackToStart} />
                </button>
                <button type='button' className={Styles.timelineControl} onClick={this.togglePlay} title="Play">
                    <i className={classnames({[Styles.iconPause]: this.isPlaying(), [Styles.iconPlay]: !this.isPlaying()})} />
                </button>
                <button type='button' className={Styles.timelineControl} onClick={this.playSlower} title="Play Slower">
                    <i className={Styles.iconBackward} />
                </button>
                <button type='button' className={Styles.timelineControl} onClick={this.playFaster} title="Play Faster">
                    <i className={Styles.iconForward} />
                </button>
                <button type='button' className={classnames(Styles.timelineControl, {[Styles.isActive]: this.isLooping()})}
                        onClick={this.toggleLoop} title="Loop at the end">
                    <i className={Styles.iconRefresh} />
                </button>
            </div>
        );
    }
});

export default TimelineControls;
