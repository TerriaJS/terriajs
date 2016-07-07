/* eslint new-parens: 0 */
import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import DataUri from '../../../Core/DataUri';
import ObserveModelMixin from '../../ObserveModelMixin';
import VarType from '../../../Map/VarType';
import Icon from "../../Icon.jsx";

import Styles from './chart-panel-download-button.scss';

const ChartPanelDownloadButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        chartableItems: React.PropTypes.array.isRequired,
        errorEvent: React.PropTypes.object.isRequired
    },

    _subscription: undefined,

    getInitialState: function() {
        return {href: undefined};
    },

    componentDidMount() {
        // console.log('ChartPanelDownloadButton mounted', this.props.chartableItems);
        this.runWorker(this.props.chartableItems);
    },

    componentWillReceiveProps(newProps) {
        // console.log('ChartPanelDownloadButton receiving props', this.props.chartableItems, newProps.chartableItems);
        this.runWorker(newProps.chartableItems);
    },

    runWorker(newValue) {
        const that = this;
        if (window.Worker) {
            that.setState({href: undefined});
            // console.log('ChartPanelDownloadButton running worker with chartableItems', newValue);
            const HrefWorker = require('worker!./downloadHrefWorker');
            const worker = new HrefWorker;
            const synthesized = that.synthesizeNameAndValueArrays();
            // console.log('names and value arrays', synthesized.names, synthesized.values);
            if (synthesized.values && synthesized.values.length > 0) {
                worker.postMessage(synthesized);
                worker.onmessage = function(event) {
                    // console.log('got worker message', event.data.slice(0, 60), '...');
                    that.setState({href: event.data});
                };
            }
        }
        // Currently no fallback for IE9-10 - just can't download.
    },

    componentWillUnmount() {
        if (defined(this._subscription)) {
            this._subscription.dispose();
        }
    },

    synthesizeNameAndValueArrays() {
        const chartableItems = this.props.chartableItems;
        const valueArrays = [];
        const names = [''];  // We will add the catalog item name back into the csv column name.
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            const xColumn = getXColumn(item);
            let columns = [xColumn];
            if (item.isEnabled && defined(item.tableStructure)) {
                if (!defined(columns[0])) {
                    continue;
                }
                const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                if (yColumns.length > 0) {
                    columns = columns.concat(yColumns);
                    valueArrays.push(columns.map(column => column.values));
                    yColumns.forEach(column => {
                        names.push(item.name + ' ' + column.name);
                    });
                }
            }
        }
        return {values: valueArrays, names: names};
    },

    render() {
        if (this.state.href) {
            const checkCompatibility = DataUri.checkCompatibility.bind(null, this.props.errorEvent, this.state.href, false);
            return (
                <a className={Styles.btnDownload}
                   download='chart data.csv'
                   href={this.state.href}
                   onClick={checkCompatibility}>
                <Icon glyph={Icon.GLYPHS.download}/>Download</a>
            );
        }
        return null;
    }
});

/**
 * Gets the column that will be used for the X axis of the chart.
 *
 * @returns {TableColumn}
 */
function getXColumn(item) {
    return item.timeColumn || (item.tableStructure && item.tableStructure.columnsByType[VarType.SCALAR][0]);
}

module.exports = ChartPanelDownloadButton;
