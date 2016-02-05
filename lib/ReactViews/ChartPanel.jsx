'use strict';

// import defined from 'terriajs-cesium/Source/Core/defined';
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
        const charts = chartableItems.map((item, i)=>{
            return (<Chart key={i}/>);
        });
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
                                {chartableItems.length} chart lines coming soon.
                                {charts}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ChartPanel;
