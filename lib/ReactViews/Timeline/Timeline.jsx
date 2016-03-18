'use strict';

import React from 'react';
import AnimationViewModel from '../../ViewModels/AnimationViewModel';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import TimelineControls from './TimelineControls';
import CesiumTimeline from './CesiumTimeline';
import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';

const Timeline = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        autoPlay: React.PropTypes.bool
    },

    getInitialState() {
        return {
            isLooping: false
        };
    },

    componentWillMount() {
        knockout.getObservable(this.props.terria.timeSeriesStack, 'topLayer').subscribe(() => this.updateForNewTopLayer());
        window.addEventListener('resize', () => this.timeline && this.timeline.resize(), false);
    },

    updateForNewTopLayer() {
        const terria = this.props.terria;

        //default to playing and looping when shown unless told otherwise
        if (this.props.autoPlay) {
            terria.clock.tick();
            terria.clock.shouldAnimate = true;
        }
        terria.clock.clockRange = ClockRange.LOOP_STOP;

        this.setState({
            isLooping: terria.clock.clockRange === ClockRange.LOOP_STOP,
            layerName: terria.timeSeriesStack.topLayer.name
        });
    },

    render() {
        const terria = this.props.terria;

        return (
            <div>
                <TimelineControls clock={terria.clock} analytics={terria.analytics} currentViewer={terria.currentViewer} />
                <div className="animation-name animation-text" title="Current Layer">
                    <div className="animation-text-display">{this.state.layerName}</div>
                </div>
                <CesiumTimeline terria={terria} />
            </div>
        );
    }
});

module.exports = Timeline;
