'use strict';
/* eslint new-parens: 0 */

import DataUri from '../../Core/DataUri';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
// import TableStructure from '../../Map/TableStructure';
import VarType from '../../Map/VarType';

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
        console.log('ChartPanelDownloadButton mounted', this.props.chartableItems);
        this.runWorker(this.props.chartableItems);
    },

    componentWillReceiveProps(newProps) {
        console.log('ChartPanelDownloadButton receiving props', this.props.chartableItems, newProps.chartableItems);
        this.runWorker(newProps.chartableItems);
    },

    runWorker(newValue) {
        const that = this;
        that.setState({href: undefined});
        console.log('ChartPanelDownloadButton running worker with chartableItems', newValue);
        const HrefWorker = require('worker!./downloadHrefWorker');
        const worker = new HrefWorker;
        const columnArrays = that.synthesizeColumnArrays();
        const valueArrays = columnArrays.map(array => array.map(column => column.values));
        const nameArrays = columnArrays.map(array => array.map(column => column.name));
        console.log('value arrays', valueArrays);
        if (valueArrays && valueArrays.length > 0) {
            worker.postMessage({values: valueArrays, names: nameArrays});
            worker.onmessage = function(event) {
                console.log('got worker message', event.data.slice(0, 60), '...');
                that.setState({href: event.data});
            };
        }
    },

    componentWillUnmount() {
        if (defined(this._subscription)) {
            this._subscription.dispose();
        }
    },

    synthesizeColumnArrays() {
        const chartableItems = this.props.chartableItems;
        const columnArrays = [];
        const columnItemNames = [''];  // We will add the catalog item name back into the csv column name.
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
                    columnArrays.push(columns);
                    for (let j = yColumns.length - 1; j >= 0; j--) {
                        columnItemNames.push(item.name);
                    }
                }
            }
        }
        return columnArrays;
        // const result = TableStructure.fromColumnArrays(columnArrays);
        // // Adjust the column names.
        // if (defined(result)) {
        //     for (let k = result.columns.length - 1; k >= 0; k--) {
        //         result.columns[k].name = columnItemNames[k] + ' ' + result.columns[k].name;
        //     }
        // }
        // return result;
    },

    render() {
        if (this.state.href) {
            const checkCompatibility = DataUri.checkCompatibility.bind(null, this.props.errorEvent, this.state.href, false);
            return (
                <a className='btn btn--download' download='chart data.csv' href={this.state.href} onClick={checkCompatibility}>Download</a>
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
