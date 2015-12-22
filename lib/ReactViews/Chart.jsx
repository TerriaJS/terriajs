'use strict';
var React = require('react');
//This is the wrapper for the chart component, not completed yet
var Chart = React.createClass({
    getInitialState: function() {
        return {
            isOpen: false,
            isVisible: false
        };
    },

    closeChart: function() {
        this.setState({
            isOpen: false
        });
    },

    render: function() {
        return (<div className={(this.state.isOpen === true ? 'is-open' : '') + ' chart-panel-holder'}>
            <div className="chart-panel p1">
              <div className="chart-panel-header flex flex-justify flex-center">
                  <h4 className="chart-panel-section-label">Data Overtime</h4>
                  <button onClick ={this.closeChart} className="chart-panel-close-button btn" title ="close"><i className='icon icon-close'></i></button>
              </div>
              <div className="chart-panel-section">
                  <div className="chart-panel-section-content">
                  </div>
              </div>
            </div>
          </div>);
    }
});
module.exports = Chart;
