'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import drawTimer from './drawTimer';

import Styles from './timer.scss';

const Timer = createReactClass({
    propTypes: {
        interval: PropTypes.number, // how long the timer runs for in seconds
        radius: PropTypes.number, // the radius of the timer circle
        elapsedTimeClass: PropTypes.string, // the name of the css class used for styling the the time indicator
        backgroundCircleClass: PropTypes.string // the name of the css classed used for styling the background colour
    },

    // We need a unique selector for the timer container.
    // If we use a class and there are multiple timers, our drawTimer function doesn't know which one to draw to.
    containerId: 'timer-container-' + new Date().getTime().toString(), 

    getDefaultProps() {
        return {
            interval: 10,
            radius: 7.5,
            elapsedTimeClass: Styles.elapsedTime,
            backgroundCircleClass: Styles.backgroundCircle
        };
    },

    componentDidMount() {
        drawTimer(this.props.radius, this.props.interval, this.containerId, this.props.elapsedTimeClass, this.props.backgroundCircleClass);
    },

    render() {
        return (
            <div id={this.containerId} className={Styles.timer}></div>
        );
    }
});

module.exports = Timer;