'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import VarType from '../Map/VarType';

import Chart from './Chart.jsx';
// import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const ChartPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        isVisible: React.PropTypes.bool,
        isCollapsed: React.PropTypes.bool,
        onClose: React.PropTypes.func
    },

    render() {
        const chartableItems = this.props.terria.catalog.chartableItems;
        const data = [];
        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                const xColumn = item.timeColumn;
                const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                if (defined(xColumn)) {
                    const getXYFunction = function(j) {
                        return (x, index)=>{ return {x: x, y: yColumns[j].values[index]}; };
                    };
                    for (let j = 0; j < yColumns.length; j++) {
                        data.push(xColumn.dates.map(getXYFunction(j)));
                    }
                }
            }
        }

        return (
            <div className="chart-panel-holder">
                <div className="chart-panel-holder-inner">
                    <div className="chart-panel" style={{height: 360}}>
                        <div className="chart-panel-body">
                            <div className="chart-panel-header" style={{height: 30, boxSizing: 'border-box'}}>
                                <span className="chart-panel-section-label">Charts</span>
                                <div className="chart-panel-close-button">&times;</div>
                            </div>
                            <div>
                                <Chart data={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ChartPanel;
