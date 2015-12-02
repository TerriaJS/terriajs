'use strict';
var Chart = React.createClass({
    getInitialState: function() {
        return {
            isOpen: false,
            isVisible: false
        };
    },

    toggleOpen: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render: function() {
        return (<div className={(this.state.isOpen === true ? 'is-open' : '') + ' chart-panel-holder'}>
            <div className="chart-panel p1">
              <div className="chart-panel-header flex flex-justify flex-center">
                  <h4 className="chart-panel-section-label">Data Overtime</h4>
                  <button onClick ={this.toggleOpen} className="chart-panel-close-button btn" title ="close">{this.state.isOpen? 'hide' : 'show'}</button>
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
