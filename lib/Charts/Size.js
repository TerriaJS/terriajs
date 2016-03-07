'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const xAxisHeight = 30; // The height of the x-axis itself, ie. the numbering of the ticks.
const xAxisLabelHeight = 25; // The additional height of the x-axis label, eg. "time".
const defaultTitleHeight = 30; // The additional height of the title, which may in fact be the legend.

const Size = {

    calculate(element, margin, state) {
        const titleHeight = defaultValue(defined(state.titleSettings) ? state.titleSettings.height : 0, defaultTitleHeight);
        const width = element.offsetWidth - margin.left - margin.right;
        const height = element.offsetHeight - margin.top - margin.bottom - titleHeight;
        const heightMinusXAxisLabelHeight = height - ((defined(state.axisLabel) && defined(state.axisLabel.x)) ? xAxisLabelHeight : 0);
        const plotHeight = heightMinusXAxisLabelHeight - (state.mini ? 0 : xAxisHeight);
        return {
            titleHeight: titleHeight,
            width: width,
            height: height,
            heightMinusXAxisLabelHeight: heightMinusXAxisLabelHeight,
            plotHeight: plotHeight,
            xAxisLabelHeight: xAxisLabelHeight
        };
    }

};


module.exports = Size;
