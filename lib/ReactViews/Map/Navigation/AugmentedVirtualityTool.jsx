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
                title: "Alignment Tool Help",
                message: "Align your mobile device so that it corresponds with the maps current alignment, then click play."
                         + " If no landmark is currently visible on the map, click play move the device till a landmark is visible then click pause before aligning the device."
                         + "<br \> <br \> [TODO Insert Alignment Image].",
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
                title: "Reset Alignment Info",
                message: "Resetting to global alignment. If the alignment doesn't match with the real world try waving"
                         + " your device in a figgure 8 motion as shown to recalibrate device. This can be done at any time."
                         + "<br \> <br \> [TODO Insert Figrue 8 Alignment Image].",
                confirmText: "Got it"
            });
        }

        this.state.augmentedVirtuality.resetAlignment();
    },

    handleClickHover() {
        // console.log("handleClickHover()");

        this.state.augmentedVirtuality.toggleHoverHeight();
    },

    enableButton() {
        const enabled = this.state.augmentedVirtuality.enabled;

        let image = Icon.GLYPHS.arOff;
        if (enabled) {
            image = Icon.GLYPHS.arOn;
        }

        return <div key="enable">
                   <button type='button' className={Styles.btn}
                           title='augmented reality tool'
                           onClick={this.handleClickAVTool}>
                           <Icon glyph={image}/>
                   </button>
               </div>;
    },

    subMenuButtons() {
        const paused = this.state.augmentedVirtuality.manualAlignment;

        let pausedImage = Icon.GLYPHS.pause;
        if (paused) {
            pausedImage = Icon.GLYPHS.play;
        }

        return <div key="submenu">
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
               </div>;
    },

    render() {
        const enabled = this.state.augmentedVirtuality.enabled;

        return <If condition={(this.props.terria.viewerMode !== ViewerMode.Leaflet) && (this.state.augmentedVirtuality.suitableBrowser())}>
                   <div className={Styles.augmentedVirtualityTool}>
                       {this.enableButton()}
                       <If condition={enabled}>
                           {this.subMenuButtons()}
                       </If>
                   </div>
               </If>;
    }
});

export default AugmentedVirtualityTool;
