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
import LineChart from '../Charts/LineChart';

const data = [{ x: 0, y: 20 }, { x: 1, y: 30 }, { x: 2, y: 10 }, { x: 3, y: 5 }, { x: 4, y: 8 }, { x: 5, y: 15 }, { x: 6, y: 10 }];
const height = 100;
const width = 300;

const Chart = React.createClass({
    // this._element is updated by the ref callback attribute, https://facebook.github.io/react/docs/more-about-refs.html
    _element: undefined,

    getDefaultProps() {
        return {
            width: width,
            height: height,
            data: [data],
            domain: undefined,
            margin: {top: 10, right: 20, bottom: 5, left: 20}
        };
    },

    componentDidMount() {
        LineChart.create(this._element, {
            width: '100%',
            height: '300px'
        }, this.getChartState());
    },

    componentDidUpdate() {
        LineChart.update(this._element, this.getChartState());
    },

    getChartState() {
        return {
            data: this.props.data,
            domain: this.props.domain
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
