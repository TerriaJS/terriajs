'use strict';

// Two possible approaches to combining D3 and React:
// 1. Render SVG element in React, let React keep control of the DOM.
// 2. React treats the element like a blackbox, and D3 is in control.
// We take the second approach, because it gives us much more of the power of D3 (animations etc).
//
// See also:
// https://facebook.github.io/react/docs/working-with-the-browser.html
// http://ahmadchatha.com/writings/article1.html
// http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app/

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import loadText from 'terriajs-cesium/Source/Core/loadText';

import LineChart from '../Charts/LineChart';
import TableStructure from '../Map/TableStructure';
// import VarType from '../Map/VarType';

const defaultHeight = 100;

const Chart = React.createClass({
    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    propTypes: {
        colors: React.PropTypes.array,
        url: React.PropTypes.string,
        data: React.PropTypes.array,  // If data is provided instead of url, it must be in the format expected by LineChart (see below).
        domain: React.PropTypes.array,
        mini: React.PropTypes.bool,
        height: React.PropTypes.number,
        transitionDuration: React.PropTypes.number
    },

    componentDidMount() {
        const that = this;
        const chartState = this.getChartState();
        if (defined(chartState.data)) {
            LineChart.create(this._element, chartState);
        } else if (defined(chartState.url)) {
            const tableStructure = new TableStructure('feature info');
            loadText(chartState.url).then(function(text) {
                tableStructure.loadFromCsv(text);
                chartState.data = tableStructure.toXYArrays(tableStructure.columns[0], [tableStructure.columns[1]]);  // TODO: use y-columns.
                // LineChart expects data to be [ [{x: x1, y: y1}, {x: x2, y: y2}], [...] ], but each subarray must also have a unique id property.
                // The data id should be set to something unique, eg. its source id + column index.
                // TODO: For now, since we are just showing the first column anyway, just set the column index to its index in the data.
                chartState.data.forEach((datum, i)=>{datum.id = i;});
                LineChart.create(that._element, chartState);
                return true;
            }).otherwise(function(e) {
                throw new DeveloperError('Could not load chart data at ' + chartState.url);
            });
        }
    },

    componentDidUpdate() {
        LineChart.update(this._element, this.getChartState());
    },

    getChartState() {
        return {
            colors: this.props.colors,
            data: this.props.data,
            domain: this.props.domain,
            url: this.props.url,
            width: '100%',
            height: defaultValue(this.props.height, defaultHeight),
            mini: this.props.mini,
            transitionDuration: this.props.transitionDuration
        };
    },

    componentWillUnmount() {
        LineChart.destroy(this._element);
    },

    render() {
        return (
            <div className='chart' ref={element=>{this._element = element;}}></div>
        );
    }
});

module.exports = Chart;
