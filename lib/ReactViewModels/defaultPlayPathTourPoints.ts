import { RelativePosition } from "../ReactViews/Tour/tour-helpers";
import { TourPoint } from "./defaultTourPoints";

export const defaultPlayPathTourPoints: TourPoint[] = [
  {
    appRefName: "PlayPathPanel",
    priority: 100,
    offsetTop: 0,
    offsetLeft: 0,
    content: "translate#playPath.tour.playPathPanel"
  },
  {
    appRefName: "PlayPathPlayButton",
    priority: 110,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#playPath.tour.playButton"
  },
  {
    appRefName: "PlayPathStopButton",
    priority: 120,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#playPath.tour.stopButton"
  },
  {
    appRefName: "PlayPathCameraPosition",
    priority: 130,
    caretOffsetTop: 0,
    caretOffsetLeft: 0,
    offsetTop: 0,
    offsetLeft: 0,
    positionTop: RelativePosition.RECT_BOTTOM,
    content: "translate#playPath.tour.cameraPosition"
  }
];
