export enum Category {
  search = "Search",
  launch = "Launch",
  help = "Help",
  timeLine = "Time line",
  view = "View",
  dataSource = "Data Source",
  dataTab = "Data tab",
  addDataUrl = "Add data Url",
  guide = "Guide",
  share = "Share",
  story = "Story"
}

export enum SearchAction {
  bing = "Bing",
  catalog = "Catalog",
  gazetteer = "Gazetteer",
  nominatim = "nominatim",
  cesium = "Cesium"
}

export enum LaunchAction {
  url = "url"
}

export enum HelpAction {
  panelOpened = "Panel opened",
  takeTour = "Take tour"
}

export enum TimeLineAction {
  goToStart = "Go to start",
  togglePlay = "Toggle play",
  playSlower = "Play slower",
  playFaster = "Play faster",
  toggleLoop = "Toggle loop"
}

export enum ViewAction {
  zoomIn = "Zoom in",
  zoomOut = "Zoom out",
  reset = "Reset",
  enterFullScreen = "Enter full screen",
  exitFullScreen = "Exit full screen"
}

export enum DataSourceAction {
  addFromCatalogue = "Add from catalogue",
  removeFromCatalogue = "Remove from catalogue",
  addFromPreviewButton = "Add from preview button",
  removeFromPreviewButton = "Remove from preview button",
  removeFromWorkbench = "Remove from workbench",
  removeAllFromWorkbench = "Remove all from workbench",
  addFromDragAndDrop = "Add from Drag and Drop",
  addFromShareOrInit = "Add from share or init source",
  addDisplayGroupFromCatalogue = "Add display group from catalogue",
  removeDisplayGroupFromCatalogue = "Remove display group from catalogue",
  addDisplayGroupFromAddAllButton = "Add display group via Add All button",
  removeDisplayGroupFromRemoveAllButton = "Remove display group via Remove All button"
}

export enum DatatabAction {
  addDataUrl = "Add data url"
}

export enum GuideAction {
  open = "open",
  close = "close",
  openInModal = "open (inside modal)",
  closeInModal = "close (inside modal)",
  navigatePrev = "Navigate previous",
  navigateNext = "Navigate next"
}

export enum ShareAction {
  storyCopy = "Story copy url",
  catalogCopy = "Catalogue copy",
  shareCopy = "Share copy"
}

export enum StoryAction {
  saveStory = "save story",
  runStory = "run story",
  viewScene = "view scene",
  datasetView = "dataset view"
}
