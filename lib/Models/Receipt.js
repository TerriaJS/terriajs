"use strict";
const triggerResize = require("../Core/triggerResize");

/************************************************************************************
 * Modify the state of the application based on url params
 * @param url params as object
 * @param viewState
 *************************************************************************************/
function RCChangeUrlParams(params = getUrlParams(), viewState) {
  console.log("🏋🏻Url Changed:", params);
  switch (true) {
    //
    // Go home
    //
    case params === "":
      window.history.pushState(null, null, "/");
      viewState.RCSelectedSector = null;
      viewState.hotspotSummaryEnabled = false;
      exitStory(viewState);
      break;
    //
    // Open story
    //
    case !!params.story && !!params.page:
      openStory(params, viewState);
      break;
    //
    // Open story summary panel
    //
    case !!params.sector && !!params.story:
      exitStory(viewState);
      viewState.RCSelectedSector = params.sector;
      openStorySummary(params, viewState);
      break;
    //
    // Open Sector panel
    //
    case !!params.sector:
      console.log("GO TO SECTOR");
      exitStory(viewState);
      viewState.hotspotSummaryEnabled = false;
      viewState.RCSelectedSector = params.sector;
      filterHotspots({ sector: params.sector }, viewState);
      break;
  }
  window.history.pushState(null, null, objectParamsToURL(params));
}

function filterHotspots({ sector }, viewState) {
  viewState.terria.nowViewing.items.map(item => {
    if (item.type === "geojson" && sector) {
      item.isShown = item.name === sector;
    } else {
      item.isShown = true;
    }
  });
}

/************************************************************************************
 * Stories
 * @param params  object: { story:Number, microstory:Number, page:Number}
 * @param terria Terria instance
 *************************************************************************************/
function openStorySummary({ sector = "agriculture", story }, viewState) {
  const hotspots = viewState.terria.nowViewing.items.find(
    item => item.name === sector
  )._dataSource.entities.values;
  const hotspot = hotspots.find(feature => {
    const value = feature._properties["_rc-story-id"]._value;
    return value === story;
  });

  if (!hotspot) {
    console.log("🚨 No hotspot found when opening summary page", hotspot);
    return;
  }
  // close possible opened stories
  viewState.storyShown = false;
  viewState.terria.currentViewer.notifyRepaintRequired();

  // Close preview summary (important to force rerender)
  // TODO find the hotspot given the story
  viewState.selectedHotspot = hotspot.properties;
  console.log("🎹", viewState.terria.nowViewing);

  // console.log('🎹', this.props.terria.nowViewing.items.find(
  //   item => item.name === selectedSector.id
  // )?._dataSource.entities.values || []);
  // hotspot.properties["rc-story-id"]._value

  viewState.hotspotSummaryEnabled = false;
  viewState.hotspotSummaryEnabled = true;
}

function openStory(paramsUrl, viewState) {
  const storyParams =
    paramsUrl?.story || viewState.selectedHotspot?.["_rc-story"]?._value;

  if (storyParams) {
    launchStory(paramsUrl, viewState.terria).then(() => {
      viewState.storyBuilderShown = false;
      viewState.storyShown = true;
      setTimeout(function() {
        triggerResize();
      }, 10);
      viewState.terria.currentViewer.notifyRepaintRequired();
      viewState.hotspotSummaryEnabled = false;
    });
  } else {
    console.error("Story id not provided");
  }
}

function launchStory(params, terria) {
  const storyUrl = getLinkToStoryFromParams(params, terria);
  const hashProperties = { share: storyUrl, playStory: "1" };
  var initSources = terria.initSources.slice();
  return terria
    .interpretHash(
      terria,
      hashProperties,
      terria.userProperties,
      terria.initSources,
      initSources
    )
    .then(() => {
      terria.loadInitSources(terria, initSources);
    });
}

function exitStory(viewState) {
  // Hide & reset story
  viewState.storyShown = false;
  viewState.currentStoryId = 0;
  viewState.terria.showSplitter = false;
  viewState.terria.currentViewer.notifyRepaintRequired();

  // Enable original catalog items
  const hotspotItems = getHotspotsCatalogItems(viewState.terria);
  viewState.terria.nowViewing.items.forEach(item => {
    const doShow =
      item.name === "EU Lines!- Mapbox Style" ||
      hotspotItems.indexOf(item) >= 0;
    item.isEnabled = doShow;
    item.isShown = doShow;
  });

  // Reset camera
  viewState.terria.currentViewer.zoomTo(viewState.terria.homeView, 1.5);
}

/*
 * @param terria
 * @returns {*}
 */
function getHotspotsCatalogItems(terria) {
  const hotspotsCatalogGroup = terria.catalog.group.items.find(item => {
    return item.name === "Hotspot Overview";
  });
  return hotspotsCatalogGroup.items;
}

/************************************************************************************
 * Helper functions
 *************************************************************************************/
function getLinkToStoryFromParams(params, terria) {
  // TODO: load the proper path when in production
  const serve_path = "/public/html/stories"; // || terria.configParameters.s3_url;
  let path_to_story = "";

  // TODO name the files with numbers instead of strings of "001".
  if (params.microstory) {
    path_to_story = `${serve_path}/story_00${params.story}/microstory_00${
      params.microstory
    }_initfile.json`;
  }

  if (params.story && !params.microstory) {
    path_to_story = `${serve_path}/story_00${params.story}/story_00${
      params.story
    }_initfile.json`;
  }
  return path_to_story;
}

// Add params to current URL
function objectParamsToURL(objectParams) {
  let str = "";
  for (const key in objectParams) {
    if (str !== "") {
      str += "&";
    }
    str += key + "=" + encodeURIComponent(objectParams[key]);
  }
  return "?" + str;
}

function getUrlParams() {
  return (
    location.search.substring(1) &&
    JSON.parse(
      '{"' +
        decodeURI(location.search.substring(1))
          .replace(/"/g, '\\"')
          .replace(/&/g, '","')
          .replace(/=/g, '":"') +
        '"}'
    )
  );
}

module.exports = {
  launchStory,
  exitStory,
  getUrlParams,
  RCChangeUrlParams
};
