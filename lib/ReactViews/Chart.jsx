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
import TableStructure from '../Core/TableStructure';
// import VarType from '../Map/VarType';

const defaultHeight = 260;

// TODO: Move this somewhere better.
function getXYData(tableStructure) {
    const data = [];
    const xColumn = tableStructure.columns[0];
    const yColumns = [tableStructure.columns[1]];
    if (defined(xColumn)) {
        const getXYFunction = function(j) {
            return (x, index)=>{ return {x: x, y: yColumns[j].values[index]}; };
        };
        for (let j = 0; j < yColumns.length; j++) {
            data.push(xColumn.dates.map(getXYFunction(j)));
        }
    }
    return data;
}

const Chart = React.createClass({
    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    _createChart(chartState) {
        LineChart.create(this._element, chartState);
    },

    getDefaultProps() {
        return {
            colors: undefined,
            data: undefined,
            url: undefined,
            domain: undefined,
            height: undefined
            // margin: {top: 10, right: 20, bottom: 5, left: 20}
        };
    },

    componentDidMount() {
        const that = this;
        const chartState = this.getChartState();
        if (defined(chartState.data)) {
            this._createChart(chartState);
        } else if (defined(chartState.url)) {
            const tableStructure = new TableStructure('feature info');
            loadText(chartState.url).then(function(text) {
                tableStructure.loadFromCsv(text);
                chartState.data = getXYData(tableStructure);
                that._createChart(chartState);
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
            height: defaultValue(this.props.height, defaultHeight)
        };
    },

    componentWillUnmount() {
        LineChart.destroy(this._element);
    },

    render() {
        return (
            <div className='chart' ref={(element) => this._element = element}></div>
        );
    }
});

module.exports = Chart;
