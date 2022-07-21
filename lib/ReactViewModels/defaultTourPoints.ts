// Position of tour point explanations relative to highlighted element.
export enum RelativePosition {
  RECT_LEFT = 0,
  RECT_RIGHT = 1,
  RECT_TOP = 2,
  RECT_BOTTOM = 3
}

export const TOUR_WIDTH = 345;

export interface TourPoint {
  appRefName: string;
  priority: number;
  caretOffsetTop?: number;
  caretOffsetLeft?: number;
  caretOffsetRight?: number;
  indicatorOffsetTop?: number;
  indicatorOffsetLeft?: number;
  indicatorOffsetRight?: number;
  offsetTop?: number;
  offsetLeft?: number;
  offsetRight?: number;
  positionTop?: RelativePosition;
  positionLeft?: RelativePosition;
  positionRight?: RelativePosition;
  content: string;
}

// use appRefName as the ID
export const defaultTourPoints = [
  {
    appRefName: "LocationSearchInput",
    priority: 30,
    offsetLeft: 225,
    offsetRight: 115,
    content: "translate#tour.locationSearchInput.content"
  },
  {
    appRefName: "ExploreMapDataButton",
    priority: 10,
    offsetLeft: 70,
    offsetRight: 70,
    content: "translate#tour.exploreMapDataButton.content"
  },
  {
    appRefName: "SidePanelUploadButton",
    priority: 20,
    offsetLeft: 70,
    offsetRight: -140,
    content: "translate#tour.sidePanelUploadButton.content"
  },
  {
    appRefName: "MenuBarMapSettingsButton",
    priority: 40,
    caretOffsetLeft: TOUR_WIDTH - 25,
    caretOffsetRight: TOUR_WIDTH - 25,
    offsetLeft: -TOUR_WIDTH - 30,
    offsetRight: -TOUR_WIDTH - 850,
    positionLeft: RelativePosition.RECT_RIGHT,
    positionRight: RelativePosition.RECT_LEFT,
    content: "translate#tour.menuBarMapSettingsButton.content"
  },
  {
    appRefName: "MenuBarStoryButton",
    priority: 50,
    caretOffsetLeft: TOUR_WIDTH - 25,
    caretOffsetRight: TOUR_WIDTH - 25,
    offsetLeft: -TOUR_WIDTH - 10,
    offsetRight: -TOUR_WIDTH - 1005,
    positionLeft: RelativePosition.RECT_RIGHT,
    positionRight: RelativePosition.RECT_LEFT,
    content: "translate#tour.menuBarStoryButton.content"
  },
  {
    appRefName: "MapNavigationCompassOuterRing",
    priority: 60,
    caretOffsetTop: 18,
    caretOffsetLeft: TOUR_WIDTH - 18,
    caretOffsetRight: TOUR_WIDTH - 18,
    indicatorOffsetTop: 6,
    indicatorOffsetLeft: 25,
    indicatorOffsetRight: 25,
    offsetTop: 0,
    offsetLeft: -TOUR_WIDTH - 15,
    offsetRight: -TOUR_WIDTH - 1095,
    positionTop: RelativePosition.RECT_TOP,
    positionLeft: RelativePosition.RECT_LEFT,
    positionRight: RelativePosition.RECT_RIGHT,
    content: "translate#tour.mapNavigationCompassOuterRing.content"
  },
  {
    appRefName: "MapNavigationSplitterIcon",
    priority: 70,
    caretOffsetTop: 20,
    caretOffsetLeft: TOUR_WIDTH - 18,
    caretOffsetRight: TOUR_WIDTH - 18,
    indicatorOffsetTop: 3,
    indicatorOffsetLeft: 17,
    indicatorOffsetRight: 17,
    offsetTop: -15,
    offsetLeft: -TOUR_WIDTH - 15,
    offsetRight: -TOUR_WIDTH - 15,
    positionTop: RelativePosition.RECT_TOP,
    positionLeft: RelativePosition.RECT_LEFT,
    positionRight: RelativePosition.RECT_RIGHT,
    content: "translate#tour.mapNavigationSplitterIcon.content"
  }
];
