'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import ObserveModelMixin from './../../ObserveModelMixin';

import { createTimer, updateTimer } from './drawTimer';

import Styles from './timer.scss';

const Timer = createReactClass({
    displayName: 'Timer',
    mixins: [ObserveModelMixin],

    propTypes: {
        start: PropTypes.object, // how long the timer runs for in seconds
        stop: PropTypes.object,
        radius: PropTypes.number.isRequired, // the radius of the timer circle
        elapsedTimeClass: PropTypes.string, // the name of the css class used for styling the the time indicator
        backgroundCircleClass: PropTypes.string, // the name of the css classed used for styling the background colour
        tooltipText: PropTypes.string
    },

    // We need a unique selector for the timer container.
    // If we use a class and there are multiple timers, our drawTimer functions don't know which one to draw to.
    containerId: 'timer-container-' + new Date().getTime().toString(),

    getDefaultProps() {
        return {
            elapsedTimeClass: Styles.elapsedTime,
            backgroundCircleClass: Styles.backgroundCircle
        };
    },

    // Calculates how long the timer should run for (in seconds).
    calculateTimerInterval() {
        if (this.props.stop > this.props.start) {
            return (this.props.stop - this.props.start) / 1000;
        }

        // This is technically an error, but it's not a serious one or one that we should expose to the user, so we 
        // ignore it
        return 0;
    },

    componentDidUpdate() {
        updateTimer(this.props.radius, this.calculateTimerInterval(), this.containerId);
    },

    componentDidMount() {
        createTimer(this.props.radius, this.calculateTimerInterval(), this.containerId, this.props.elapsedTimeClass, this.props.backgroundCircleClass);
    },

    render() {
        return (
            <div id={this.containerId} className={Styles.timer} title={this.props.tooltipText}></div>
        );
    }
});

module.exports = Timer;