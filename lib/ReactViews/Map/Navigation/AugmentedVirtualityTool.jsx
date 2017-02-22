'use strict';

import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './augmented_virtuality_tool.scss';
import Icon from "../../Icon.jsx";

const AugmentedVirtuality = require('../../../Models/AugmentedVirtuality.js');

const AugmentedVirtualityTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
             augmented_virtuality : new AugmentedVirtuality(this.props.terria),
        };
    },

    handleClickAVTool() {
        console.log("handleClickAVTool()");

        this.state.augmented_virtuality.toggleEnabled();
    },

    handleClickRealign() {
        console.log("handleClickRealign()");

        this.state.augmented_virtuality.toggleManualAlignment();
    },

    handleClickResetRealign() {
        console.log("handleClickHover()");

        this.state.augmented_virtuality.resetAlignment();
    },

    handleClickHover() {
        console.log("handleClickHover()");

        this.state.augmented_virtuality.toggleHoverHeight();
    },

    enableButton() {
        const enabled = this.state.augmented_virtuality.enabled;

        let image = Icon.GLYPHS.arOff;
        if (enabled)
        {
            image = Icon.GLYPHS.arOn;
        }

        return <div>
                   <button type='button' className={Styles.btn}
                           title='ar tool todo better description'
                           onClick={this.handleClickAVTool}>
                           <Icon glyph={image}/>
                   </button>
               </div>;
    },

    subMenuButtons() {
        const paused = this.state.augmented_virtuality.manualAlignment;

        let paused_image = Icon.GLYPHS.pause;
        if (paused)
        {
            paused_image = Icon.GLYPHS.play;
        }

        return <div>
                   <button type='button' className={Styles.btn}
                           title='toggle hover todo better description'
                           onClick={this.handleClickHover}>
                           <Icon glyph={Icon.GLYPHS.download}/>
                   </button>

                   <button type='button' className={Styles.btn}
                           title='realignment tool todo better description'
                           onClick={this.handleClickRealign}>
                           <Icon glyph={paused_image}/>
                   </button>

                   <button type='button' className={Styles.btn}
                           title='reset realignment tool todo better description'
                           onClick={this.handleClickResetRealign}>
                           <Icon glyph={Icon.GLYPHS.arRecalibrate}/>
                   </button>
               </div>;
    },

    render() {
// todo only do the following if  === > react-if (viewmode == 3d)

        const enabled = this.state.augmented_virtuality.enabled;

        let content = null;
        if (!enabled) {
            content = <div> {this.enableButton()} </div>;
        }
        else
        {
            content = <div> {this.enableButton()} {this.subMenuButtons()} </div>;
        }

        return <div className={Styles.augmentedVirtualityTool}> {content} </div> ;
    }
});

export default AugmentedVirtualityTool;
