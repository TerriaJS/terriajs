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
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            augmentedVirtuality: new AugmentedVirtuality(this.props.terria),
        };
    },

    handleClickAVTool() {
        console.log("handleClickAVTool()");

        this.state.augmentedVirtuality.toggleEnabled();
    },

    handleClickRealign() {
        console.log("handleClickRealign()");

        this.state.augmentedVirtuality.toggleManualAlignment();
    },

    handleClickResetRealign() {
        console.log("handleClickHover()");

        this.state.augmentedVirtuality.resetAlignment();
    },

    handleClickHover() {
        console.log("handleClickHover()");

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
                           title='ar tool todo better description'
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
                           title='toggle hover todo better description'
                           onClick={this.handleClickHover}>
                           <Icon glyph={Icon.GLYPHS.download}/>
                   </button>

                   <button type='button' className={Styles.btn}
                           title='realignment tool todo better description'
                           onClick={this.handleClickRealign}>
                           <Icon glyph={pausedImage}/>
                   </button>

                   <button type='button' className={Styles.btn}
                           title='reset realignment tool todo better description'
                           onClick={this.handleClickResetRealign}>
                           <Icon glyph={Icon.GLYPHS.arRecalibrate}/>
                   </button>
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
