'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import DataUri from '../Core/DataUri';
import TableStructure from '../Map/TableStructure';
import VarType from '../Map/VarType';

import Chart from './Chart.jsx';
import ChartData from '../Charts/ChartData';
import Loader from './Loader.jsx';
// import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const ChartPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        isVisible: React.PropTypes.bool,
        isCollapsed: React.PropTypes.bool,
        onClose: React.PropTypes.func,
        viewState: React.PropTypes.object
    },

    closePanel() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                item.tableStructure.columns
                    .filter(column=>column.isActive)
                    .forEach(column=>column.toggleActive());
            }
        }
    },

    synthesizeTableStructure() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        const columnArrays = [];
        const columnItemNames = [''];  // We will add the catalog item name back into the csv column name.
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            let columns = [item.timeColumn];
            if (item.isEnabled && defined(item.tableStructure)) {
                if (!defined(columns[0])) {
                    continue;
                }
                const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                columns = columns.concat(yColumns);
                columnArrays.push(columns);
                for (let j = yColumns.length - 1; j >= 0; j--) {
                    columnItemNames.push(item.name);
                }
            }
        }
        const result = TableStructure.fromColumnArrays(columnArrays);
        // Adjust the column names.
        if (defined(result)) {
            for (let k = result.columns.length - 1; k >= 0; k--) {
                result.columns[k].name = columnItemNames[k] + ' ' + result.columns[k].name;
            }
        }
        return result;
},

    bringToFront(){
        //bring chart to front
        this.props.viewState.switchComponentOrder(this.props.viewState.componentOrderOptions.chart);
    },

    render() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        let data = [];
        let xUnits;
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                const xColumn = item.timeColumn;
                if (defined(xColumn)) {
                    const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                    if (yColumns.length > 0) {
                        const yColumnNumbers = yColumns.map(yColumn=>item.tableStructure.columns.indexOf(yColumn));
                        const pointArrays = item.tableStructure.toPointArrays(xColumn, yColumns);
                        const thisData = pointArrays.map(chartDataFunctionFromPoints(item, yColumns, yColumnNumbers));
                        data = data.concat(thisData);
                        xUnits = defined(xUnits) ? xUnits : xColumn.units;
                    }
                }
            }
        }
        const isLoading = (chartableItems.length > 0) && (chartableItems[chartableItems.length - 1].isLoading);
        const isVisible = (data.length > 0) || isLoading;
        if (!isVisible) {
            return null;
        }
        let loader;
        let chart;
        if (isLoading) {
            loader = <Loader/>;
        }
        if (data.length > 0) {
            chart = (
                <Chart data={data} axisLabel={{x: xUnits, y: undefined}} height={266}/>
            );
        }
        const tableStructureToDownload = this.synthesizeTableStructure();
        let downloadButton;
        if (defined(tableStructureToDownload)) {
            const href = DataUri.make('csv', tableStructureToDownload.toCsvString());
            // TODO: if you add true to this to forceError, you'll see it never gets raised... why?
            const checkCompatibility = DataUri.checkCompatibility.bind(null, this.props.terria, href);
            downloadButton = <a className='btn btn--chart-expand' download='chart data.csv' href={href} onClick={checkCompatibility}>Download</a>;
        }
        return (
            <div className={`chart-panel__holder ${this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.chart ? 'is-top' : ''}`} onClick={this.bringToFront}>
                <div className="chart-panel__holder__inner">
                    <div className="chart-panel" style={{height: 300}}>
                        <div className="chart-panel__body">
                            <div className="chart-panel__header" style={{height: 41, boxSizing: 'border-box'}}>
                                <div className='left'><span className="chart-panel__section-label label">{loader || 'Charts'}</span></div>
                                <div className='right'>
                                    <a download='chart data.csv' className='btn--download btn' href={href}>Download</a>
                                    <button className="btn btn--close-chart-panel" onClick={this.closePanel}></button>
                                </div>
                            </div>
                            <div>
                                {chart}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

function chartDataFunctionFromPoints(item, yColumns, yColumnNumbers) {
    return (points, index)=>
        new ChartData(points, {
            id: item.uniqueId + '-' + yColumnNumbers[index],
            name: yColumns[index].name,
            categoryName: item.name,
            units: yColumns[index].units,
            color: yColumns[index].color
        });
}

module.exports = ChartPanel;
