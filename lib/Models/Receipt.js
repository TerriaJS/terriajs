"use strict";
const triggerResize = require("../Core/triggerResize");

/************************************************************************************
 * Modify the state of the application based on url params
 * @param url params as object
 * @param viewState
 *************************************************************************************/
function RCChangeUrlParams(params = getUrlParams(), viewState) {
  console.log("🏋🏻Url Changed:", params, window.location.href);
  // Don't route on params when being at the builder section
  if (
    window.location.href.includes("#/users") ||
    window.location.href.includes("#/builder")
  ) {
    return;
  }
  window.history.pushState(
    null,
    null,
    objectParamsToURL(params === "" ? null : params)
  );

  switch (true) {
    //
    // Go home
    //
    case params === "":
      viewState.RCSelectedSector = null;
      viewState.hotspotSummaryEnabled = false;
      exitStory(viewState);
      showAllHotspots(viewState);
      break;
    //
    // Open story
    //
    case !!params.sector && !!params.story && !!params.page:
      viewState.storyShown = false;
      openStory(params, viewState);
      filterHotspots({ sector: params.sector }, viewState);
      setTimeout(() => {
        viewState.hotspotSummaryEnabled = false;
      }, 300);
      break;
    //
    // Open story summary panel
    //
    case !!params.sector && !!params.story:
      viewState.storyShown = false;
      exitStory(viewState);
      filterHotspots({ sector: params.sector }, viewState);
      openStorySummary(params, viewState);
      viewState.RCSelectedSector = params.sector;
      viewState.hotspotSummaryEnabled = true;
      break;
    //
    // Open Sector panel
    //
    case !!params.sector:
      viewState.hotspotSummaryEnabled = false;
      filterHotspots({ sector: params.sector }, viewState);
      viewState.RCSelectedSector = params.sector;
      break;
  }
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

function hideHotspots(viewState) {
  viewState.terria.nowViewing.items.map(item => {
    item.isShown = false;
  });
}

function showAllHotspots(viewState) {
  const allHotspots = viewState.terria.nowViewing.items.filter(
    item => item.rcType === "hotspots"
  );
  for (const item of allHotspots) {
    item.isShown = true;
  }
}

/************************************************************************************
 * Stories
 * @param params  object: { story:Number, microstory:Number, page:Number}
 * @param terria Terria instance
 *************************************************************************************/
function openStorySummary(params, viewState) {
  const hotspot = viewState.terria.nowViewing.items
    .find(item => item.name === params.sector)
    ._dataSource.entities.values.find(
      feature =>
        feature.properties["_rc-story-id"]._value === parseInt(params.story)
    );
  if (!hotspot) {
    console.log("🚨 No hotspot found when opening summary page", hotspot);
    return;
  }
  viewState.selectedHotspot = hotspot.properties;
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
  RCChangeUrlParams,
  objectParamsToURL,
  hideHotspots
};
