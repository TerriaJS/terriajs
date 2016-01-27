'use strict';
const React = require('react');
// This is the wrapper for the chart component, not completed yet

const Chart = React.createClass({
    getDefaultProps() {
        return {
            width: 300,
            height: 200,
            color: '#FFF'
        };
    },
    render() {
        return (
          <div className='chart'>
            <svg width={this.props.width} height={this.props.height}>
              <path d={0} stroke={this.props.color} strokeWidth={this.props.stroke} fill="none" />
            </svg>
          </div>);
    }
});
module.exports = Chart;
