'use strict';
const React = require('react');
const d3 = require('d3');

const data = [{ x: 0, y: 20 }, { x: 1, y: 30 }, { x: 2, y: 10 }, { x: 3, y: 5 }, { x: 4, y: 8 }, { x: 5, y: 15 }, { x: 6, y: 10 }];
const height = 100;
const width = 300;
const yScale = d3.scale.linear()
      .domain([0, 30])
      .range([0, height]);
const xScale = d3.scale.linear()
      .domain([0, 6])
      .range([0, width]);

const Chart = React.createClass({
    getDefaultProps() {
        return {
            width: width,
            height: height,
            color: '#FFF',
            data: data,
            yScale: yScale,
            xScale: xScale,
            margin: {top: 10, right: 20, bottom: 10, left: 20}
        };
    },
    render() {
        const path = d3.svg.line()
        .x((d)=>xScale(d.x))
        .y((d)=>yScale(d.y))
        .interpolate('basic');

        const style = {
            transform: 'translate(' + this.props.margin.left + 'px ,' + (-this.props.margin.bottom) + 'px )'
        };

        return (
          <div className='chart'>
            <svg width={this.props.width} height={this.props.height} style={style}>
              <path d={path(this.props.data)} stroke={this.props.color} strokeWidth={this.props.stroke} fill="none" />
            </svg>
          </div>);
    }
});
module.exports = Chart;
