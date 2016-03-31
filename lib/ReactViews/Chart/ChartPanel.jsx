'use strict';

import Chart from './Chart.jsx';
import ChartData from '../../Charts/ChartData';
import DataUri from '../../Core/DataUri';
import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import TableStructure from '../../Map/TableStructure';
import triggerResize from 'terriajs/lib/Core/triggerResize';
import VarType from '../../Map/VarType';

const height = 250;

const ChartPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        onHeightChange: React.PropTypes.func,
        viewState: React.PropTypes.object.isRequired
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

    componentDidUpdate() {
        this.props.onHeightChange && this.props.onHeightChange();
    },

    synthesizeTableStructure() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        const columnArrays = [];
        const columnItemNames = [''];  // We will add the catalog item name back into the csv column name.
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            let columns = [getXColumn(item)];
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
        const result = TableStructure.fromColumnArrays(columnArrays);
        // Adjust the column names.
        if (defined(result)) {
            for (let k = result.columns.length - 1; k >= 0; k--) {
                result.columns[k].name = columnItemNames[k] + ' ' + result.columns[k].name;
            }
        }
        return result;
    },

    bringToFront() {
        // Bring chart to front.
        this.props.viewState.switchComponentOrder(this.props.viewState.componentOrderOptions.chart);
    },

    toggleBodyClass(isVisible){
        const body = document.body;
        body.classList.toggle('chart-is-visible', isVisible);
        this.props.terria.currentViewer.notifyRepaintRequired();
        // Allow any animations to finish, then trigger a resize.
        setTimeout(function() {
            triggerResize();
        }, this.props.animationDuration || 1);
    },

    render() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        let data = [];
        let xUnits;
        let xType;
        const itemsToInactivate = [];
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                const xColumn = getXColumn(item);
                if (defined(xColumn)) {
                    const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                    if (yColumns.length > 0) {
                        if (!defined(xType)) {
                            xType = xColumn.type;
                        } else if (xColumn.type !== xType) {
                            // If this x column type doesn't match the previous one, flag it to turn it off.
                            itemsToInactivate.push(i);
                            continue;
                        }
                        const yColumnNumbers = yColumns.map(yColumn=>item.tableStructure.columns.indexOf(yColumn));
                        const pointArrays = item.tableStructure.toPointArrays(xColumn, yColumns);
                        const thisData = pointArrays.map(chartDataFunctionFromPoints(item, yColumns, yColumnNumbers));
                        data = data.concat(thisData);
                        xUnits = defined(xUnits) ? xUnits : xColumn.units;
                    }
                }
            }
        }
        // TODO: This changes chartableItems, which will trigger a re-render... check & improve.
        itemsToInactivate.forEach(i=>{
            chartableItems[i].tableStructure.columns.forEach(column=>{
                column.isActive = false;
            });
        });

        const isLoading = (chartableItems.length > 0) && (chartableItems[chartableItems.length - 1].isLoading);
        const isVisible = (data.length > 0) || isLoading;

        this.toggleBodyClass(isVisible);

        if (!isVisible) {
            return null;
        }
        let loader;
        let chart;
        if (isLoading) {
            loader = <Loader/>;
        }
        if (data.length > 0) {
            // TODO: use a calculation for the 34 pixels taken off...
            chart = (
                <Chart data={data} axisLabel={{x: xUnits, y: undefined}} height={height - 34}/>
            );
        }
        const tableStructureToDownload = this.synthesizeTableStructure();
        let downloadButton;
        if (defined(tableStructureToDownload)) {
            const href = DataUri.make('csv', tableStructureToDownload.toCsvString());
            // TODO: if you add true to this to forceError, you'll see it never gets raised... why?
            const checkCompatibility = DataUri.checkCompatibility.bind(null, this.props.terria, href);
            downloadButton = <a className='btn btn--download' download='chart data.csv' href={href} onClick={checkCompatibility}>Download</a>;
        }
        return (
            <div className={`chart-panel__holder ${(this.props.viewState && this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.chart) ? 'is-top' : ''}`} onClick={this.bringToFront}>
                <div className="chart-panel__holder__inner">
                    <div className="chart-panel" style={{height: height}}>
                        <div className="chart-panel__body">
                            <div className="chart-panel__header" style={{height: 41, boxSizing: 'border-box'}}>
                                <label className="chart-panel__section-label label">{loader || 'Charts'}</label>
                                {downloadButton}
                                <button type='button' className="btn btn--close-chart-panel" onClick={this.closePanel}></button>
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

function getXColumn(item) {
    return item.timeColumn || (item.tableStructure && item.tableStructure.columnsByType[VarType.SCALAR][0]);
}

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
