"use strict";

import ViewerMode from "./ViewerMode";
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
    // Open story
    //
    case !!params.sector && !!params.story && !!params.page:
      if (viewState.currentStoryId && viewState.currentStoryId === params.page) {
        break; //TODO
      }
      viewState.currentStoryId = params.page;
      viewState.storyShown = true; // TODO: setting this to false clashes with LAUNCH story only being called once

      // Disable the base map when we're in a story
      var receiptBaseMapCatalogItem = getCatalogMemberByName(
        viewState.terria.catalog,
        "EU Lines!- Mapbox Style"
      );
      toggleCatalogMember(receiptBaseMapCatalogItem, false);

      // Disable the hotspots when we're in a story
      // var hotspotCatalogGroup = getCatalogMemberByName(viewState.terria.catalog, "Hotspot Overview");
      // toggleCatalogMember(hotspotCatalogGroup, false);

      openStory(params, viewState);
      setTimeout(() => {
        viewState.hotspotSummaryEnabled = false;
      }, 300);
      break;

    //
    // Open story summary panel
    //
    case !!params.sector && !!params.story:
      exitStory(viewState);
      filterHotspots(viewState.terria.catalog, {
        sector: params.sector,
        story: params.story
      });
      openStorySummary(params, viewState);
      viewState.RCSelectedSector = params.sector;
      viewState.hotspotSummaryEnabled = true;
      viewState.storyShown = false;
      break;

    //
    // Open Sector panel
    //
    case !!params.sector:
      viewState.RCSelectedSector = params.sector;
      viewState.hotspotSummaryEnabled = false;
      viewState.storyShown = false;
      exitStory(viewState);
      filterHotspots(viewState.terria.catalog, { sector: params.sector });
      break;

    //
    // Go home
    //
    case params === "":
      viewState.RCSelectedSector = null;
      viewState.hotspotSummaryEnabled = false;
      viewState.storyShown = false;
      exitStory(viewState);
      filterHotspots(viewState.terria.catalog, {});
      break;
  }

  console.log(viewState.terria.catalog);
}

function filterHotspots(catalog, { sector, story }) {
  getCatalogMemberByName(catalog, "Hotspot Overview").items.forEach(function(
    catalogItem
  ) {
    if (catalogItem.type === "geojson" && sector && story) {
      catalogItem._dataSource.entities.values.forEach(function(feature) {
        console.log(feature.show);
        if (catalogItem.name === sector) {
          // catalogItem.isEnabled = true;
          // catalogItem.isShown = true;
          if (
            feature.properties["_rc-story-id"]._value === parseInt(story, 10)
          ) {
            feature.show = true;
          } else {
            feature.show = false;
          }
        } else {
          catalogItem.isEnabled = false;
          catalogItem.isShown = false;
        }
      });
    } else if (catalogItem.type === "geojson" && sector) {
      if (catalogItem.name === sector) {
        catalogItem.isEnabled = true;
        catalogItem.isShown = true;
      } else {
        catalogItem.isEnabled = false;
        catalogItem.isShown = false;
      }
    }
  });
}

/************************************************************************************
 * Stories
 * @param params  object: { story:Number, microstory:Number, page:Number}
 * @param terria Terria instance
 *************************************************************************************/
function openStorySummary(params, viewState) {
  console.log("OPEN STORY SUMMARY", viewState, params);
  const hotspotFeature = getCatalogMemberByName(
    viewState.terria.catalog,
    "Hotspot Overview"
  )
    .items.find(item => item.name === params.sector)
    ._dataSource.entities.values.find(
      feature =>
        feature.properties["_rc-story-id"]._value === parseInt(params.story)
    );
  if (!hotspotFeature) {
    console.log(
      "🚨 No hotspot found when opening summary page",
      hotspotFeature
    );
    return;
  }
  viewState.selectedHotspot = hotspotFeature.properties;
}

function openStory(params, viewState) {
  console.log("OPEN STORY", viewState, params);
  const storyID = params?.story || viewState.selectedHotspot?.["rc-story"]?.getValue();

  if (storyID) {
    var group = getCurrentStoryCatalogGroup(
      viewState.terria.catalog,
      params
    );
    console.log("group", group);
    if (group) {
      toggleCatalogMember(group, true);
    } else {
      launchStory(params, viewState.terria).then(() => {
        viewState.storyBuilderShown = false;
        viewState.storyShown = true;
        setTimeout(function() {
          triggerResize();
        }, 10);
        viewState.terria.currentViewer.notifyRepaintRequired();
      });
    }
  } else {
    console.error("Story id not provided");
  }
}

function launchStory(params, terria) {
  console.log("LAUNCH STORY", terria.viewState, params);
  const storyUrl = getLinkToStoryFromParams(params, terria);
  const hashProperties = { share: storyUrl, playStory: "1" };

  //Load the new story data and load it.
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

function getCurrentStoryCatalogGroup(catalog, params) {
  //TODO: 00x? -> just use the story id in the group name?
  var story_group_name = `Story 00${params.story} data`;
  return getCatalogMemberByName(catalog, story_group_name);
}

function getCatalogMemberByName(catalog, name) {
  const catalogMember = catalog.group.items.find(item => item.name === name);
  return catalogMember;
}

function toggleCatalogMember(catalogMember, toggle = true) {
  catalogMember.isEnabled = toggle;
  catalogMember.isShown = toggle;
  catalogMember.isOpen = toggle;
  if (catalogMember.items && catalogMember.items?.length) {
    catalogMember.items.forEach(item => {
      item.isShown = toggle;
      item.isEnabled = toggle;
    });
  }
}

function exitStory(viewState) {
  // Hide & reset story
  viewState.storyShown = false;
  viewState.currentStoryId = 0;
  viewState.terria.showSplitter = false;

  // Reset to 2D map view
  viewState.ViewerMode = ViewerMode.Cesium2D;

  // Reset camera
  viewState.terria.currentViewer.zoomTo(viewState.terria.homeView, 1.0);

  // Enable original 'base' catalog items and disable all others
  const receiptBaseMapCatalogItem = getCatalogMemberByName(
    viewState.terria.catalog,
    "EU Lines!- Mapbox Style"
  );
  const hotspotCatalogGroup = getCatalogMemberByName(
    viewState.terria.catalog,
    "Hotspot Overview"
  );

  viewState.terria.catalog.group.items.forEach((item, i) => {
    if (item === receiptBaseMapCatalogItem) {
      toggleCatalogMember(item, true);
    } else if (item === hotspotCatalogGroup) {
      toggleCatalogMember(item, true);
    } else {
      toggleCatalogMember(item, false);
    }
  });

  viewState.terria.currentViewer.notifyRepaintRequired();
}

/************************************************************************************
 * Helper functions
 *************************************************************************************/
function getLinkToStoryFromParams(params, terria) {
  // TODO: load the proper path when in production
  const serve_path = "/public/html/stories"; // || terria.configParameters.s3_url;
  let path_to_story = "";

  if (params.story && params.microstory) {
    const padded_storynum = String(params.story).padStart(3, "0");
    const padded_microstorynum = String(params.microstory).padStart(3, "0");
    path_to_story = `${serve_path}/story_${padded_storynum}/microstory_${padded_microstorynum}_initfile.json`;
  }

  if (params.story && !params.microstory) {
    const padded_storynum = String(params.story).padStart(3, "0");
    path_to_story = `${serve_path}/story_${padded_storynum}/story_${padded_storynum}_initfile.json`;
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
  objectParamsToURL
};
