'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './augmented_virtuality_tool.scss';
import Icon from "../../Icon.jsx";
import ViewerMode from '../../../Models/ViewerMode';

const AugmentedVirtuality = require('../../../Models/AugmentedVirtuality.js');

const AugmentedVirtualityTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            augmentedVirtuality: new AugmentedVirtuality(this.props.terria),
            realignHelpShown: false,
            resetRealignHelpShown: false
        };
    },

    handleClickAVTool() {
        // console.log("handleClickAVTool()");

        this.state.augmentedVirtuality.toggleEnabled();
    },

    handleClickRealign() {
        // console.log("handleClickRealign()");

        if (!this.state.realignHelpShown) {
            this.setState({realignHelpShown: true});

            this.props.viewState.notifications.push({
                title: "Manual Alignment",
                message: "Align your mobile device so that it corresponds with the maps current alignment, then click play."
                         + " If no landmarks to align with are currently visible on the map, you can move the map using"
                         + " drag and pinch actions until a recognisable landmark is visable before aligning the device with the map."
                         + "<br \> <br \>[TODO: Insert alignment image: Side-by-side map and realworld image.]."
                         + "<br \> <br \>Tip: The sun or moon are often good landmarks to align with (be careful not to look at the sun - it can hurt your eyes).",
                confirmText: "Got it"
            });
        }

        this.state.augmentedVirtuality.toggleManualAlignment();
    },

    handleClickResetRealign() {
        // console.log("handleClickHover()");

        if (!this.state.resetRealignHelpShown) {
            this.setState({resetRealignHelpShown: true});

            this.props.viewState.notifications.push({
                title: "Reset Alignment",
                message: "Resetting to compass alignment. If the alignment doesn't match the real world try waving"
                         + " your device in a figgure 8 motion to recalibrate device. This can be done at any time."
                         + "<br \> <br \>Avoid locations with magnetic fields or metal objects as these may disorient the devices compass.",
                confirmText: "Got it"
            });
        }

        this.state.augmentedVirtuality.resetAlignment();
    },

    handleClickHover() {
        // console.log("handleClickHover()");

        this.state.augmentedVirtuality.toggleHoverHeight();
    },

    render() {
        const enabled = this.state.augmentedVirtuality.enabled;
        let image = Icon.GLYPHS.arOff;
        if (enabled) {
            image = Icon.GLYPHS.arOn;
        }

        const paused = this.state.augmentedVirtuality.manualAlignment;
        let pausedImage = Icon.GLYPHS.pause;
        if (paused) {
            pausedImage = Icon.GLYPHS.play;
        }

        return <If condition={(this.props.terria.viewerMode !== ViewerMode.Leaflet) && (this.state.augmentedVirtuality.suitableBrowser())}>
                   <div className={Styles.augmentedVirtualityTool}>
                       <button type='button' className={Styles.btn}
                               title='augmented reality tool'
                               onClick={this.handleClickAVTool}>
                               <Icon glyph={image}/>
                       </button>

                       <If condition={enabled}>
                           <button type='button' className={Styles.btn}
                                   title='toggle hover height'
                                   onClick={this.handleClickHover}>
                                   <Icon glyph={Icon.GLYPHS.download}/>
                           </button>

                           <button type='button' className={Styles.btn}
                                   title='toggle manual alignment'
                                   onClick={this.handleClickRealign}>
                                   <Icon glyph={pausedImage}/>
                           </button>

                           <If condition={(this.state.augmentedVirtuality.manualAlignmentSet)}>
                               <button type='button' className={Styles.btn}
                                       title='reset manual alignment'
                                       onClick={this.handleClickResetRealign}>
                                       <Icon glyph={Icon.GLYPHS.arRecalibrate}/>
                               </button>
                           </If>
                       </If>
                   </div>
               </If>;
    }
});

export default AugmentedVirtualityTool;
