'use strict';

import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import DataUri from '../../Core/DataUri';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import TableStructure from '../../Map/TableStructure';
import VarType from '../../Map/VarType';

const ChartPanelDownloadButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
    },

    _subscription: undefined,

    getInitialState: function() {
        return {href: undefined};
    },

    componentDidMount() {
        var that = this;
        this._subscription = knockout.getObservable(this.props.terria.catalog, 'chartableItems').subscribe(function(newValue) {
            var HrefWorker = require("worker!./downloadHrefWorker");
            var worker = new HrefWorker;
            var essentialData = this.props.terria.catalog.chartableItems.map(item=>{
                return {
                    isEnabled: item.isEnabled,
                    name: item.name,
                    tableStructure: item.tableStructure
                };
            });
            worker.postMessage(essentialData);
            worker.onmessage = function(event) {
                that.setState({href: event.data});
            }
        }, this);
    },

    componentWillUnmount() {
        if (defined(this._subscription)) {
            this._subscription.dispose();
        }
    },

    // synthesizeTableStructure() {
    //     const chartableItems = this.props.terria.catalog.chartableItems;
    //     const columnArrays = [];
    //     const columnItemNames = [''];  // We will add the catalog item name back into the csv column name.
    //     for (let i = chartableItems.length - 1; i >= 0; i--) {
    //         const item = chartableItems[i];
    //         const xColumn = getXColumn(item);
    //         let columns = [xColumn];
    //         if (item.isEnabled && defined(item.tableStructure)) {
    //             if (!defined(columns[0])) {
    //                 continue;
    //             }
    //             const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
    //             if (yColumns.length > 0) {
    //                 columns = columns.concat(yColumns);
    //                 columnArrays.push(columns);
    //                 for (let j = yColumns.length - 1; j >= 0; j--) {
    //                     columnItemNames.push(item.name);
    //                 }
    //             }
    //         }
    //     }
    //     const result = TableStructure.fromColumnArrays(columnArrays);
    //     // Adjust the column names.
    //     if (defined(result)) {
    //         for (let k = result.columns.length - 1; k >= 0; k--) {
    //             result.columns[k].name = columnItemNames[k] + ' ' + result.columns[k].name;
    //         }
    //     }
    //     return result;
    // },

    render() {
        if (this.state.href) {
            // TODO: if you add true to this to forceError, you'll see it never gets raised... why?  Or worse, sometimes it gets raised even after the download has worked?
            const checkCompatibility = DataUri.checkCompatibility.bind(null, this.props.terria, this.state.href);
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
