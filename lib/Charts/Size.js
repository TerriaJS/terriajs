"use strict";

import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import Title from "./Title";
const defaultXAxisHeight = 14; // The default height of the x-axis itself, ie. the numbering of the ticks.
const defaultXAxisLabelHeight = 20; // The default additional height of the x-axis label, eg. "time".

const yAxisWidth = 45;

const Size = {
  calculate(element, margin, state, numberOfYAxes) {
    const xAxisHeight = defaultValue(state.xAxisHeight, defaultXAxisHeight);
    const xAxisLabelHeight = defaultValue(
      state.xAxisLabelHeight,
      defaultXAxisLabelHeight
    );
    const yAxesWidth = numberOfYAxes * yAxisWidth;
    const titleHeight = Title.getHeight(state.titleSettings);
    const width = element.offsetWidth - margin.left - margin.right - yAxesWidth;
    const height =
      element.offsetHeight - margin.top - margin.bottom - titleHeight;
    const heightMinusXAxisLabelHeight =
      height -
      (defined(state.axisLabel) && defined(state.axisLabel.x)
        ? xAxisLabelHeight
        : 0);
    const plotHeight =
      heightMinusXAxisLabelHeight - (state.mini ? 0 : xAxisHeight);
    return {
      width: width,
      yAxesWidth: yAxesWidth,
      height: height,
      heightMinusXAxisLabelHeight: heightMinusXAxisLabelHeight,
      plotHeight: plotHeight,
      xAxisHeight: xAxisHeight,
      xAxisLabelHeight: xAxisLabelHeight
    };
  },

  yAxisWidth: yAxisWidth
};

export default Size;
