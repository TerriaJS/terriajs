// Position of tour point explanations relative to highlighted element.
export enum RelativePosition {
  RECT_LEFT = 0,
  RECT_RIGHT = 1,
  RECT_TOP = 2,
  RECT_BOTTOM = 3
}

export const TOUR_WIDTH = 335;

export type TourPoint = any;
export const defaultTourPoints = [
  {
    appRefName: "ExploreMapDataButton",
    priority: 10,
    dotOffset: undefined,
    content:
      "## Explore map data\n\nBrowse the catalogue of available data and add it to the map here. You can add multiple datasets at any one time, and you’ll see them listed down below in the Workbench."
  },
  {
    appRefName: "LocationSearchInput",
    priority: 20,
    dotOffset: undefined,
    content:
      "## Location search\n\nEnter a locality or address to easily locate a point of interest on the map."
  },
  {
    appRefName: "MenuBarMapSettingsButton",
    priority: 30,
    dotOffset: undefined,
    offsetLeft: -TOUR_WIDTH,
    positionLeft: RelativePosition.RECT_RIGHT,
    content:
      "## Map Settings\n\nCustomise map options such as base maps, map image quality or remove the ground (terrain) to interrogate underground datasets."
  },
  {
    appRefName: "MenuBarStoryButton",
    priority: 40,
    dotOffset: undefined,
    offsetLeft: -TOUR_WIDTH,
    positionLeft: RelativePosition.RECT_RIGHT,
    content:
      "## Stories\n\nStories allow you to add contextual information to a dataset to bring a narrative to life. Create your own data story using the Story Editor, and share it via the ‘Share’ panel once you’re done."
  },
  {
    appRefName: "MapNavigationCompassOuterRing",
    priority: 50,
    dotOffset: undefined,
    offsetLeft: -TOUR_WIDTH,
    positionLeft: RelativePosition.RECT_RIGHT,
    content:
      "## View controls\n\nHere you can change the view of the map. You can change the orientation of your view by using the outer ring, and you can tilt the camera angle using the inner ring. Double click to reset the view."
  },
  {
    appRefName: "MapNavigationSplitterIcon",
    priority: 60,
    dotOffset: undefined,
    offsetLeft: -TOUR_WIDTH,
    positionLeft: RelativePosition.RECT_RIGHT,
    content:
      "## Compare\n\nA powerful feature of Terria is the ability to compare datasets using a split screen view. For datasets with a time-series/4D component, you can compare dates backwards and forwards in time using the date picker."
  }
];
