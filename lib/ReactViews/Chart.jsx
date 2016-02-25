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
import when from 'terriajs-cesium/Source/ThirdParty/when';

import LineChart from '../Charts/LineChart';
import TableStructure from '../Map/TableStructure';
// import VarType from '../Map/VarType';

const defaultHeight = 100;

const Chart = React.createClass({
    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    _promise: undefined,

    propTypes: {
        colors: React.PropTypes.array,
        url: React.PropTypes.string,
        data: React.PropTypes.array,  // If data is provided instead of url, it must be in the format expected by LineChart (see below).
        domain: React.PropTypes.object,
        mini: React.PropTypes.bool,
        height: React.PropTypes.number,
        axisLabel: React.PropTypes.object,
        transitionDuration: React.PropTypes.number
    },

    getInitialState() {
        // If the data is downloaded here from a URL, then store the downloaded data in state.data.
        return {
            data: undefined
        };
    },

    componentDidMount() {
        const that = this;
        const chartParameters = this.getChartParameters();
        let promise;
        if (defined(chartParameters.data)) {
            promise = when(LineChart.create(this._element, chartParameters));
        } else if (defined(chartParameters.url)) {
            const tableStructure = new TableStructure('feature info');
            promise = loadText(chartParameters.url).then(function(text) {
                tableStructure.loadFromCsv(text);
                chartParameters.data = tableStructure.toXYArrays(tableStructure.columns[0], [tableStructure.columns[1]]);  // TODO: use y-columns.
                // LineChart expects data to be [ [{x: x1, y: y1}, {x: x2, y: y2}], [...] ], but each subarray must also have a unique id property.
                // The data id should be set to something unique, eg. its source id + column index.
                // TODO: For now, since we are just showing the first column anyway, just set the column index to its index in the data.
                chartParameters.data.forEach((datum, i)=>{datum.id = i;});
                LineChart.create(that._element, chartParameters);
                that.setState({data: chartParameters.data});  // Triggers componentDidUpdate, so only do this after the line chart exists.
            }).otherwise(function(e) {
                // It looks better to create a blank chart than no chart.
                chartParameters.data = [];
                LineChart.create(that._element, chartParameters);
                that.setState({data: chartParameters.data});
                throw new DeveloperError('Could not load chart data at ' + chartParameters.url);
            });
        }
        this._promise = promise.then(function() {
            // that.rnd = Math.random();
            // React should handle the binding for you, but it doesn't seem to work here; perhaps because it is inside a Promise?
            // So we return the bound listener function from the promise.
            const resize = function() {
                // This function basically the same as componentDidUpdate, but it speeds up transitions.
                if (that._element) {
                    const localChartParameters = that.getChartParameters();
                    localChartParameters.transitionDuration = 1;
                    LineChart.update(that._element, localChartParameters);
                } else {
                    // This would happen if event listeners were not properly removed (ie. if you get this error, a bug was introduced to this code).
                    throw new DeveloperError('Missing chart DOM element ' + that.url);
                }
            };
            // console.log('Listening for resize on', that.props.url, that.rnd, boundComponentDidUpdate);
            window.addEventListener('resize', resize);
            return resize;
        });
    },

    componentDidUpdate() {
        LineChart.update(this._element, this.getChartParameters());
    },

    componentWillUnmount() {
        const that = this;
        this._promise.then(function(listener) {
            window.removeEventListener('resize', listener);
            // console.log('Removed resize listener for', that.props.url, that.rnd, listener);
            LineChart.destroy(that._element);
            that._element = undefined;
        });
        this._promise = undefined;
    },

    getChartParameters() {
        return {
            colors: this.props.colors,
            data: defined(this.state.data) ? this.state.data : this.props.data,
            domain: this.props.domain,
            url: this.props.url,
            width: '100%',
            height: defaultValue(this.props.height, defaultHeight),
            axisLabel: this.props.axisLabel,
            mini: this.props.mini,
            transitionDuration: this.props.transitionDuration
        };
    },

    render() {
        return (
            <div className='chart' ref={element=>{this._element = element;}}></div>
        );
    }
});

module.exports = Chart;
