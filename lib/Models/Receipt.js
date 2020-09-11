"use strict";

/**
 * Open Story from the popup
 * @param params  object: { story:Number, microstory:Number, page:Number}
 * @param terria Terria instance
 */
function launchStory(params, terria) {
  const storyUrl = getLinkToStoryFromParams(params, terria);

  // Assign story params to URL
  window.history.replaceState(null, null, objectParamsToURL(params));

  // Terria commands
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

function exitStory(terria, viewState) {
  // clean url params
  window.history.replaceState(null, null, "/");

  // Hide & reset story
  viewState.storyShown = false;
  viewState.currentStoryId = 0;
  terria.showSplitter = false;
  terria.currentViewer.notifyRepaintRequired();

  // Enable original catalog items
  const hotspotItems = getHotspotsCatalogItems(terria);
  terria.nowViewing.items.forEach(item => {
    const doShow =
      item.name === "EU Lines!- Mapbox Style" ||
      hotspotItems.indexOf(item) >= 0;
    item.isEnabled = doShow;
    item.isShown = doShow;
  });

  // Reset camera
  terria.currentViewer.zoomTo(terria.homeView, 1.5);
}

function getHotspotsCatalogItems(terria) {
  const hotspotsCatalogGroup = terria.catalog.group.items.find(item => {
    return item.name === "Hotspot Overview";
  });
  return hotspotsCatalogGroup.items;
}

//
// Helper functions
//
function getLinkToStoryFromParams(params, terria) {
  let path_to_story = "";
  //
  if (params.microstory) {
    path_to_story = `/public/html/receipt_stories/story_00${
      params.story
    }/microstory_00${params.microstory}_initfile.json`;
  }

  if (params.story && !params.microstory) {
    path_to_story = `${terria.configParameters.s3_url}/stories/story_00${
      params.story
    }/story_00${params.story}_initfile.json`;
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
  getUrlParams
};
