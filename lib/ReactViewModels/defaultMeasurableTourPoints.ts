import { RelativePosition } from "../ReactViews/Tour/tour-helpers";
import { TourPoint } from "./defaultTourPoints";

export const defaultMeasurableTourPoints: TourPoint[] = [
  {
    appRefName: "MeasurablePanel",
    priority: 100,
    offsetTop: 0,
    offsetLeft: 0,
    content: "translate#measurableGeometry.tour.panel"
  },
  {
    appRefName: "MeasurableSamplingStep",
    priority: 110,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#measurableGeometry.tour.samplingStep"
  },
  {
    appRefName: "MeasurableChartButton",
    priority: 120,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#measurableGeometry.tour.chartButton"
  },
  {
    appRefName: "MeasurableClampButton",
    priority: 130,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#measurableGeometry.tour.clampButton"
  },
  {
    appRefName: "MeasurableTransformButton",
    priority: 140,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#measurableGeometry.tour.transformButton"
  },
  {
    appRefName: "MeasurableMultiPathControls",
    priority: 150,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#measurableGeometry.tour.multiPathControls"
  }
];
