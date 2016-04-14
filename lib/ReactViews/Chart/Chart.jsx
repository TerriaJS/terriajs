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

import ChartData from '../../Charts/ChartData';
import LineChart from '../../Charts/LineChart';
import TableStructure from '../../Map/TableStructure';
// import VarType from '../Map/VarType';

const defaultHeight = 100;

const Chart = React.createClass({
    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    _promise: undefined,

    _tooltipId: undefined,

    propTypes: {
        domain: React.PropTypes.object,
        styling: React.PropTypes.string,  // nothing, 'feature-info' or 'histogram' -- TODO: improve
        height: React.PropTypes.number,
        axisLabel: React.PropTypes.object,
        transitionDuration: React.PropTypes.number,
        // You either need to provide the data via props.data or as an Array of ChartData.
        data: React.PropTypes.array,
        // Or, provide a URL to the data, along with optional xColumn, yColumns, colors
        url: React.PropTypes.string,
        sourceData: React.PropTypes.array,
        xColumn: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
        yColumns: React.PropTypes.array,
        colors: React.PropTypes.array,
        highlightX: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number])
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
            promise = when(LineChart.create(this.buttonElement, chartParameters));
        } else if (defined(chartParameters.url) || defined(chartParameters.sourceData)) {
            const tableStructure = new TableStructure('feature info');
            const loadPromise = defined(chartParameters.sourceData)
                ? when(chartParameters.sourceData).then(tableStructure.loadFromJson.bind(tableStructure))
                : loadText(chartParameters.url).then(tableStructure.loadFromCsv.bind(tableStructure));
            promise = loadPromise.then(function(table) {
                const xColumn = table.getColumnWithNameOrIndex(that.props.xColumn || 0);
                let yColumns = [table.columns[1]];
                if (defined(that.props.yColumns)) {
                    yColumns = that.props.yColumns.map(yCol=>table.getColumnWithNameOrIndex(yCol));
                }
                const pointArrays = table.toPointArrays(xColumn, yColumns);
                // The data id should be set to something unique, eg. its source id + column index.
                // If we're here, the data was downloaded from a url, ie. comes from a single file, so the column index is unique by itself.
                chartParameters.data = pointArrays.map((points, index)=>
                    new ChartData(points, {
                        id: index,
                        name: yColumns[index].name,
                        color: defined(that.props.colors) ? that.props.colors[index] : undefined
                    })
                );
                LineChart.create(that.buttonElement, chartParameters);
                that.setState({data: chartParameters.data});  // Triggers componentDidUpdate, so only do this after the line chart exists.
            }).otherwise(function(e) {
                // It looks better to create a blank chart than no chart.
                chartParameters.data = [];
                LineChart.create(that.buttonElement, chartParameters);
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
                if (that.buttonElement) {
                    const localChartParameters = that.getChartParameters();
                    localChartParameters.transitionDuration = 1;
                    LineChart.update(that.buttonElement, localChartParameters);
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
        LineChart.update(this.buttonElement, this.getChartParameters());
    },

    componentWillUnmount() {
        const that = this;
        this._promise.then(function(listener) {
            window.removeEventListener('resize', listener);
            // console.log('Removed resize listener for', that.props.url, that.rnd, listener);
            LineChart.destroy(that.buttonElement, that.getChartParameters());
            that.buttonElement = undefined;
        });
        this._promise = undefined;
    },

    getChartParameters() {
        // If it is not a mini-chart, add tooltip settings (including a unique id for the tooltip DOM element).
        let margin;
        let tooltipSettings;
        let titleSettings;
        let grid;
        if (this.props.styling !== 'feature-info') {
            if (!defined(this._tooltipId)) {
                // In case there are multiple charts with tooltips. Unlikely to pick the same random number. Remove the initial "0.".
                this._tooltipId = 'd3-tooltip-' + Math.random().toString().substr(2);
            }
            margin = {
                top: 0,  // So the title is flush with the top of the chart panel.
                right: 20,
                bottom: 20,
                left: 0
            };
            tooltipSettings = {
                id: this._tooltipId,
                align: 'prefer-right', // With right/left alignment, the offset is relative to the svg, so need to inset.
                offset: {top: 40, left: 50, right: 20, bottom: 5}
            };
            titleSettings = {
                type: 'legend',
                height: 30
            };
            grid = {
                x: true,
                y: true
            };
        }
        if (defined(this.props.highlightX)) {
            tooltipSettings = undefined;
        }
        if (this.props.styling === 'histogram') {
            titleSettings = undefined;
            margin = {top: 0, right: 0, bottom: 0, left: 0};
        }

        return {
            data: defined(this.state.data) ? this.state.data : this.props.data,
            domain: this.props.domain,
            url: this.props.url,
            sourceData: this.props.sourceData,
            width: '100%',
            height: defaultValue(this.props.height, defaultHeight),
            axisLabel: this.props.axisLabel,
            mini: this.props.styling === 'feature-info',
            transitionDuration: this.props.transitionDuration,
            margin: margin,
            tooltipSettings: tooltipSettings,
            titleSettings: titleSettings,
            grid: grid,
            highlightX: this.props.highlightX
        };
    },

    render() {
        return (
            <div className='chart' ref={element=>{this.buttonElement = element;}}></div>
        );
    }
});

module.exports = Chart;
