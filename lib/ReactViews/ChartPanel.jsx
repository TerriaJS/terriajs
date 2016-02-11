'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

import VarType from '../Map/VarType';

import Chart from './Chart.jsx';
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
        let colors = [];
        let data = [];
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                const xColumn = item.timeColumn;
                if (defined(xColumn)) {
                    const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                    data = data.concat(item.tableStructure.toXYArrays(xColumn, yColumns));
                    colors = colors.concat(yColumns.map(yColumn=>yColumn.assignedColor));
                }
            }
        }
        if (!data.length) {
            return null;
        }
        return (
            <div className="chart-panel__holder">
                <div className="chart-panel__holder__inner">
                    <div className="chart-panel" style={{height: 300}}>
                        <div className="chart-panel__body">
                            <div className="chart-panel__header" style={{height: 41, boxSizing: 'border-box'}}>
                                <span className="chart-panel__section-label label">Charts</span>
                                <button className="btn btn--close-chart-panel"></button>
                            </div>
                            <div>
                                <Chart data={data} colors={colors} height={266}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ChartPanel;
