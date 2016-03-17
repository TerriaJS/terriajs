'use strict';

import React from 'react';
import AnimationViewModel from '../../ViewModels/AnimationViewModel';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import defined from ''

const Timeline = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        autoPlay: React.PropTypes.bool
    },

    getInitialState() {
        return {
            isPlaying: false,
            isLooping: false
        };
    },

    componentWillMount() {
        knockout.getObservable(this.props.terria.timeSeriesStack, 'topLayer').subscribe(() => this.updateForNewTopLayer());
        window.addEventListener('resize', () => this.timeline && this.timeline.resize(), false);
    },

    updateForNewTopLayer() {

    },



    render() {
        return (
            <div>
                <div class="animation-controls" data-bind="visible: showAnimation">
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
                <div class="animation-name animation-text" data-bind="visible: showAnimation" title="Current Layer">
                    <div class="animation-text-display" data-bind="text: layerName"></div>
                </div>
                <div class="animation-timeline" data-bind="visible: showAnimation">
                </div>
            </div>
        );
    }
});

module.exports = Timeline;
