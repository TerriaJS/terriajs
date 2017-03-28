'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './augmented_virtuality_tool.scss';
import Icon from '../../Icon.jsx';
import ViewerMode from '../../../Models/ViewerMode';
import defined from 'terriajs-cesium/Source/Core/defined';

import AugmentedVirtuality from '../../../Models/AugmentedVirtuality.js';

const AugmentedVirtualityTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        experimentalWarning: React.PropTypes.bool
    },

    getInitialState() {
        return {
            augmentedVirtuality: new AugmentedVirtuality(this.props.terria),
            experimentalWarningShown: false,
            realignHelpShown: false,
            resetRealignHelpShown: false
        };
    },

    handleClickAVTool() {
        // console.log('handleClickAVTool()');

        // Make the AugmentedVirtuality module avaliable elsewhere.
        this.props.terria.augmentedVirtuality = this.state.augmentedVirtuality;

        if (defined(this.props.experimentalWarning) &&
            (this.props.experimentalWarning !== false) &&
            !this.state.experimentalWarningShown) {

            this.setState({experimentalWarningShown: true});

            this.props.viewState.notifications.push({
                title: 'Experimental Feature: Augmented Reality',
                message: 'Augmented Reality mode is currently in beta. '
                         + 'This mode is only designed for use on the latest high end mobile devices. '
                         + '<br /><br />WARNING: This mode can consume a lot of data, please be mindful of data usage charges from your network provider. '
                         + '<br /><br />The accuracy of this mode depends on the accuracy of your mobile devices internal compass.',
                confirmText: 'Got it'
            });
        }

        this.state.augmentedVirtuality.toggleEnabled();
    },

    handleClickRealign() {
        // console.log('handleClickRealign()');

        if (!this.state.realignHelpShown) {
            this.setState({realignHelpShown: true});

            this.props.viewState.notifications.push({
                title: 'Manual Alignment',
                message: 'Align your mobile device so that it corresponds with the maps current alignment, then click the blinking compass.'
                         + ' If no landmarks to align with are currently visible on the map, you can move the map using'
                         + ' drag and pinch actions until a recognisable landmark is visible before aligning the device with the map.'
                         + '<br /><div><img width="100%" src="./build/TerriaJS/images/ar-realign-guide.gif" /></div>'
                         + '<br />Tip: The sun or moon are often good landmarks to align with if you are in a location you aren\x27t familiar with (be careful not to look at the sun - it can hurt your eyes).',
                confirmText: 'Got it'
            });
        }

        this.state.augmentedVirtuality.toggleManualAlignment();
    },

    handleClickResetRealign() {
        // console.log('handleClickHover()');

        if (!this.state.resetRealignHelpShown) {
            this.setState({resetRealignHelpShown: true});

            this.props.viewState.notifications.push({
                title: 'Reset Alignment',
                message: 'Resetting to compass alignment. If the alignment doesn\x27t match the real world try waving'
                         + ' your device in a figure 8 motion to recalibrate device. This can be done at any time.'
                         + '<br /> <br />Avoid locations with magnetic fields or metal objects as these may disorient the devices compass.',
                confirmText: 'Got it'
            });
        }

        this.state.augmentedVirtuality.resetAlignment();
    },

    handleClickHover() {
        // console.log('handleClickHover()');

        this.state.augmentedVirtuality.toggleHoverHeight();
    },

    render() {
        const enabled = this.state.augmentedVirtuality.enabled;
        let toggleImage = Icon.GLYPHS.arOff;
        let toggleStyle = Styles.btn;
        if (enabled) {
            toggleImage = Icon.GLYPHS.arOn;
            toggleStyle = Styles.btnPrimary;
        }

        const realignment = this.state.augmentedVirtuality.manualAlignment;
        let realignmentStyle = Styles.btn;
        if (realignment) {
            realignmentStyle = Styles.btnBlink;
        }

        const hoverLevel = this.state.augmentedVirtuality.hoverLevel;
        let hoverImage = Icon.GLYPHS.arHover0;
        // Note: We use the image of the next level that we will be changing to, not the level the we are currently at.
        switch (hoverLevel) {
            case 0:
                hoverImage = Icon.GLYPHS.arHover0;
                break;
            case 1:
                hoverImage = Icon.GLYPHS.arHover1;
                break;
            case 2:
                hoverImage = Icon.GLYPHS.arHover2;
                break;
        }

        return <If condition={(this.props.terria.viewerMode !== ViewerMode.Leaflet) && (this.state.augmentedVirtuality.suitableBrowser())}>
                   <div className={Styles.augmentedVirtualityTool}>
                       <button type='button' className={toggleStyle}
                               title='augmented reality tool'
                               onClick={this.handleClickAVTool}>
                               <Icon glyph={toggleImage}/>
                       </button>

                       <If condition={enabled}>
                           <button type='button' className={Styles.btn}
                                   title='toggle hover height'
                                   onClick={this.handleClickHover}>
                                   <Icon glyph={hoverImage}/>
                           </button>

                           <If condition={!this.state.augmentedVirtuality.manualAlignmentSet}>
                               <button type='button' className={realignmentStyle}
                                       title='toggle manual alignment'
                                       onClick={this.handleClickRealign}>
                                       <Icon glyph={Icon.GLYPHS.arRealign}/>
                               </button>
                           </If>

                           <If condition={(this.state.augmentedVirtuality.manualAlignmentSet) && !realignment}>
                               <button type='button' className={Styles.btn}
                                       title='reset compass alignment'
                                       onClick={this.handleClickResetRealign}>
                                       <Icon glyph={Icon.GLYPHS.arResetAlignment}/>
                               </button>
                           </If>
                       </If>
                   </div>
               </If>;
    }
});

export default AugmentedVirtualityTool;
