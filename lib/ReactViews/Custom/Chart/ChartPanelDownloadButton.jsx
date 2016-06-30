'use strict';
/* global Float32Array */
/* eslint new-parens: 0 */
import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import TaskProcessor from 'terriajs-cesium/Source/Core/TaskProcessor';
import when from 'terriajs-cesium/Source/ThirdParty/when';

import DataUri from '../../../Core/DataUri';
import ObserveModelMixin from '../../ObserveModelMixin';
import VarType from '../../../Map/VarType';

import Styles from './chart-panel-download-button.scss';

// const hrefProcessor = new TaskProcessor('lib/ReactViews/Chart/downloadHrefWorker');

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
        if (window.Worker && (typeof Float32Array !== 'undefined')) {
            when(TaskProcessor._canTransferArrayBuffer, function(canTransferArrayBuffer) {
                if (!canTransferArrayBuffer) {
                    // Don't try it if the browser can't handle transferring typed arrays.
                    return;
                }
                that.setState({href: undefined});
                const synthesized = that.synthesizeNameAndValueArrays();
                // It would be better to implement this using TaskProcessor, but this requires webpack magic.
                // if (!synthesized.values || synthesized.values.length === 0) {
                //     return;
                // }
                // // console.log('ChartPanelDownloadButton running worker with chartableItems', newValue);
                // const promise = hrefProcessor.scheduleTask(synthesized);
                // if (!defined(promise)) {
                //     // Too many active tasks - ideally, try again later.
                // } else {
                //     when(promise, function(result) {
                //         // use the result of the task
                //         that.setState({href: result});
                //     });
                // }
                const HrefWorker = require('worker!./downloadHrefWorker');
                const worker = new HrefWorker;
                // console.log('names and value arrays', synthesized.names, synthesized.values);
                if (synthesized.values && synthesized.values.length > 0) {
                    worker.postMessage(synthesized);
                    worker.onmessage = function(event) {
                        // console.log('got worker message', event.data.slice(0, 60), '...');
                        that.setState({href: event.data});
                    };
                }
            });
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
                    // Use typed array if possible so we can pass by pointer to the web worker.
                    // Create a new array otherwise because if values are a knockout observable, they cannot be serialised for the web worker.
                    valueArrays.push(columns.map(column => (column.type === VarType.SCALAR ? new Float32Array(column.values) : Array.prototype.slice.call(column.values))));
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
                   onClick={checkCompatibility}>Download</a>
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
