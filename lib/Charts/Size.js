'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import Title from './Title';

const xAxisHeight = 30; // The height of the x-axis itself, ie. the numbering of the ticks.
const xAxisLabelHeight = 25; // The additional height of the x-axis label, eg. "time".

const yAxisWidth = 50;

const Size = {

    calculate(element, margin, state, numberOfYAxes) {
        const titleHeight = Title.getHeight(state.titleSettings);
        const yAxesWidth = numberOfYAxes * yAxisWidth;
        const width = element.offsetWidth - margin.left - margin.right - yAxesWidth;
        const height = element.offsetHeight - margin.top - margin.bottom - titleHeight;
        const heightMinusXAxisLabelHeight = height - ((defined(state.axisLabel) && defined(state.axisLabel.x)) ? xAxisLabelHeight : 0);
        const plotHeight = heightMinusXAxisLabelHeight - (state.mini ? 0 : xAxisHeight);
        return {
            width: width,
            yAxesWidth: yAxesWidth,
            height: height,
            heightMinusXAxisLabelHeight: heightMinusXAxisLabelHeight,
            plotHeight: plotHeight,
            xAxisLabelHeight: xAxisLabelHeight
        };
    }

};


module.exports = Size;
