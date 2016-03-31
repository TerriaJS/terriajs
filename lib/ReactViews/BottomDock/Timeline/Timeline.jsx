'use strict';

import React from 'react';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import TimelineControls from './TimelineControls';
import CesiumTimeline from './CesiumTimeline';
import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
import {formatDateTime} from './DateFormats';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

const Timeline = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        autoPlay: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            autoPlay: true
        };
    },

    getInitialState() {
        return {
            currentTimeString: '<>'
        };
    },

    componentWillMount() {
        this.resizeListener = () => this.timeline && this.timeline.resize();
        window.addEventListener('resize', this.resizeListener, false);

        this.removeTickEvent = this.props.terria.clock.onTick.addEventListener(clock => {
            const time = clock.currentTime;
            this.setState({
                currentTimeString: formatDateTime(JulianDate.toDate(time), this.props.locale)
            });
        });

        this.topLayerSubscription = knockout.getObservable(this.props.terria.timeSeriesStack, 'topLayer').subscribe(() => this.updateForNewTopLayer());
        this.updateForNewTopLayer();
    },

    componentWillUnmount() {
        this.removeTickEvent();
        this.topLayerSubscription.dispose();
        window.removeEventListener('resize', this.resizeListener);
    },

    updateForNewTopLayer() {
        const terria = this.props.terria;
        const newTopLayer = terria.timeSeriesStack.topLayer;

        // default to playing and looping when shown unless told otherwise
        if (newTopLayer && this.props.autoPlay) {
            terria.clock.tick();
            terria.clock.shouldAnimate = true;
        }

        terria.clock.clockRange = ClockRange.LOOP_STOP;

        this.setState({
            layerName: newTopLayer && newTopLayer.name
        });
    },

    render() {
        const terria = this.props.terria;
        const layerName = terria.timeSeriesStack.topLayer && terria.timeSeriesStack.topLayer.name;

        return (
            <div className="timeline">
                <div className="timeline__text-row">
                    <div className="timeline__text-cell timeline__text-cell--time" title="Current Time (tz info et al)">{this.state.currentTimeString}</div>
                    <div className="timeline__text-cell" title="Current Layer">{layerName}</div>
                </div>
                <div className="timeline__controls-row">
                    <TimelineControls clock={terria.clock} analytics={terria.analytics} currentViewer={terria.currentViewer} />
                    <CesiumTimeline terria={terria} />
                </div>
            </div>
        );
    }
});

module.exports = Timeline;
