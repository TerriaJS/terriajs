'use strict';

import createReactClass from 'create-react-class';
import dateFormat from 'dateformat';
import React from 'react';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ClockRange from 'terriajs-cesium/Source/Core/ClockRange';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import ObserveModelMixin from '../../ObserveModelMixin';
import TimelineControls from './TimelineControls';
import CesiumTimeline from './CesiumTimeline';
import DateTimePicker from './DateTimePicker';
import {formatDateTime} from './DateFormats';

import Styles from './timeline.scss';

const Timeline = createReactClass({
    displayName: 'Timeline',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        autoPlay: PropTypes.bool,
        locale: PropTypes.object
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
            let currentTime;
            if (defined(this.props.terria.timeSeriesStack.topLayer) && defined(this.props.terria.timeSeriesStack.topLayer.dateFormat.currentTime)) {
                currentTime = dateFormat(time, this.props.terria.timeSeriesStack.topLayer.dateFormat.currentTime);
            } else {
                currentTime = formatDateTime(JulianDate.toDate(time), this.props.locale);
            }

            this.setState({
                currentTimeString: currentTime
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
        let autoPlay = this.props.terria.autoPlay;
        if(!defined(autoPlay)) {
            autoPlay = this.props.autoPlay;
        }
        const terria = this.props.terria;
        const newTopLayer = terria.timeSeriesStack.topLayer;

        // default to playing and looping when shown unless told otherwise
        if (newTopLayer && autoPlay) {
            terria.clock.tick();
            terria.clock.shouldAnimate = true;
        }

        terria.clock.clockRange = ClockRange.LOOP_STOP;

        this.setState({
            layerName: newTopLayer && newTopLayer.name
        });
    },

    changeDateTime(time) {
        this.props.terria.clock.currentTime = JulianDate.fromDate(new Date(time));
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const terria = this.props.terria;
        const catalogItem = terria.timeSeriesStack.topLayer;
        if (!defined(catalogItem)) {
            return null;
        }
        return (
            <div className={Styles.timeline}>
                <div className={Styles.textRow}>
                    <div className={Styles.textCell} title="Name of the dataset whose time range is shown">{catalogItem.name} {this.state.currentTimeString}</div>
                </div>
                <div className={Styles.controlsRow}>
                    <TimelineControls clock={terria.clock} analytics={terria.analytics} currentViewer={terria.currentViewer} />
                    <If condition={defined(catalogItem.availableDates) && (catalogItem.availableDates.length !== 0)}>
                        <DateTimePicker currentDate={catalogItem.clampedDiscreteTime} dates={catalogItem.availableDates} onChange={this.changeDateTime} openDirection='up'/>
                    </If>
                    <CesiumTimeline terria={terria} />
                </div>
            </div>
        );
    }
});

module.exports = Timeline;
