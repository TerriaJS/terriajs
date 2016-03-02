'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

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
        onClose: React.PropTypes.func
    },

    render() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        let data = [];
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                const xColumn = item.timeColumn;
                if (defined(xColumn)) {
                    const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                    const yColumnNumbers = yColumns.map(yColumn=>item.tableStructure.columns.indexOf(yColumn));
                    const pointArrays = item.tableStructure.toPointArrays(xColumn, yColumns);
                    const parameters = {
                        ids: pointArrays.map((d, index)=>item.uniqueId + '-' + yColumnNumbers[index]),
                        names: pointArrays.map(()=>item.name),
                        categoryNames: pointArrays.map((d, index)=>yColumns[index].name),
                        units: pointArrays.map((d, index)=>yColumns[index].units),
                        colors: pointArrays.map((d, index)=>yColumns[index].color)
                    };
                    data = data.concat(new ChartData(pointArrays, parameters));
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
                <Chart data={data} colors={colors} height={266}/>
            );
        }
        return (
            <div className="chart-panel__holder">
                <div className="chart-panel__holder__inner">
                    <div className="chart-panel" style={{height: 300}}>
                        <div className="chart-panel__body">
                            <div className="chart-panel__header" style={{height: 41, boxSizing: 'border-box'}}>
                                <span className="chart-panel__section-label label">{loader || 'Charts'}</span>
                                <button className="btn btn--close-chart-panel"></button>
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

module.exports = ChartPanel;
