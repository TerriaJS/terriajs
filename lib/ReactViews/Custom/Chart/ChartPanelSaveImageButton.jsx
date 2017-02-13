'use strict';
/* global Float32Array */
/* eslint new-parens: 0 */
import React from 'react';

import DataUri from '../../../Core/DataUri';
import Icon from "../../Icon.jsx";

import Styles from './chart-panel-download-button.scss';
import ChartStyles from './chart-panel.scss';

const ChartPanelSaveImageButton = React.createClass({

    propTypes: {
        chart: React.PropTypes.object,
        errorEvent: React.PropTypes.object.isRequired
    },
    
    onSaveImageCallback() {
        const html2canvas = require('html2canvas');
        console.log(ChartStyles);
        const chart = document.querySelector('.' + ChartStyles.chart)
        html2canvas(chart, {
            logging: true,
            onrendered: function(canvas) {
                const download = document.createElement('a');
                download.href = canvas.toDataURL();
                download.download = 'chart.png';
                document.body.appendChild(download);
                download.click();
                document.body.removeChild(download);
            }
        });
    },

    render() {
        if (this.props.chart) {
            console.log('render');
            return (
                <span className={Styles.btnDownload}
                      onClick={this.onSaveImageCallback}>
                <Icon glyph={Icon.GLYPHS.lineChart}/>Save Image</span>
            );
        }
        return null;
    }
});

module.exports = ChartPanelSaveImageButton;
