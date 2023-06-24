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
  indicatorOffsetTop?: number;
  indicatorOffsetLeft?: number;
  offsetTop?: number;
  offsetLeft?: number;
  positionTop?: RelativePosition;
  positionLeft?: RelativePosition;
  content: string;
}

// use appRefName as the ID
export const defaultTourPoints = [
  {
    appRefName: "LocationSearchInput",
    priority: 30,
    offsetLeft: 225,
    content: "translate#tour.locationSearchInput.content"
  },
  {
    appRefName: "ExploreMapDataButton",
    priority: 10,
    offsetLeft: 70,
    content: "translate#tour.exploreMapDataButton.content"
  },
  {
    appRefName: "SidePanelUploadButton",
    priority: 20,
    offsetLeft: 70,
    content: "translate#tour.sidePanelUploadButton.content"
  },
  {
    appRefName: "MenuBarMapSettingsButton",
    priority: 40,
    caretOffsetLeft: TOUR_WIDTH - 25,
    offsetLeft: -TOUR_WIDTH - 30,
    positionLeft: RelativePosition.RECT_RIGHT,
    content: "translate#tour.menuBarMapSettingsButton.content"
  },
  {
    appRefName: "MenuBarStoryButton",
    priority: 50,
    caretOffsetLeft: TOUR_WIDTH - 25,
    offsetLeft: -TOUR_WIDTH - 10,
    positionLeft: RelativePosition.RECT_RIGHT,
    content: "translate#tour.menuBarStoryButton.content"
  },
  {
    appRefName: "MapNavigationCompassOuterRing",
    priority: 60,
    caretOffsetTop: 18,
    caretOffsetLeft: TOUR_WIDTH - 18,
    indicatorOffsetTop: 15,
    indicatorOffsetLeft: 25,
    offsetTop: 0,
    offsetLeft: -TOUR_WIDTH - 15,
    positionTop: RelativePosition.RECT_TOP,
    positionLeft: RelativePosition.RECT_LEFT,
    content: "translate#tour.mapNavigationCompassOuterRing.content"
  },
  {
    appRefName: "MapNavigationSplitterIcon",
    priority: 70,
    caretOffsetTop: 20,
    caretOffsetLeft: TOUR_WIDTH - 18,
    indicatorOffsetTop: 3,
    indicatorOffsetLeft: 17,
    offsetTop: -15,
    offsetLeft: -TOUR_WIDTH - 15,
    positionTop: RelativePosition.RECT_TOP,
    positionLeft: RelativePosition.RECT_LEFT,
    content: "translate#tour.mapNavigationSplitterIcon.content"
  }
];
