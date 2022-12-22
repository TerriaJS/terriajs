"use strict";

import ViewerMode from "./ViewerMode";
import when from "terriajs-cesium/Source/ThirdParty/when";
const triggerResize = require("../Core/triggerResize");

function activateStory(viewState, fromStory, resetZoom) {
  // console.log(`activateStory called`);
  if (!viewState.terria || !viewState.terria.stories || viewState.selectedPageIndex === undefined || !viewState.selectedScenario === undefined) {
    // console.log(`activateStory failed: ${viewState.terria.stories.length} ? ${viewState.selectedPageIndex} : ${viewState.selectedScenario}`, viewState.terria.stories, viewState.selectedPage);
    return;
  }

  const stories = viewState.terria.stories || [];
  const selectedPage = stories[viewState.selectedPageIndex];

  if (selectedPage && selectedPage.mapScenarios && selectedPage.mapScenarios[viewState.selectedScenario]) {
    // console.log(`activateStory: `, selectedPage);
    const initSources = selectedPage.mapScenarios[viewState.selectedScenario].initSources;

    const promises = initSources.map(initSource =>
      viewState.terria.addInitSource(initSource, fromStory, resetZoom)
    );
    when.all(promises).then(() => {
      // console.log(`activateStory promises done`);

      const catalogPaths = initSources.reduce((p, c) => {
        if (c.sharedCatalogMembers) {
          return p.concat(Object.keys(c.sharedCatalogMembers));
        }
        return p;
      }, []);
      // console.log(`Catalog paths: `, catalogPaths, viewState.terria.catalog, viewState.selectedStoryID);

      const catalogItems = getStoryCatalogGroup(viewState.terria.catalog, viewState.selectedStoryID).items;
      // console.log(`catalogItems before: `, catalogItems);

      catalogItems.forEach(function (item) {
        const path = item.uniqueId;

        if (catalogPaths.indexOf(path) < 0) {
          item.isEnabled = false;
          item.isShown = false;
        } else {
          item.isEnabled = true;
          item.isShown = true;
        }
      });

      // console.log(`catalogItems after: `, catalogItems);
    });
  }
}

function loadInitialTerriaState(viewState) {
  resetTerriaState(viewState);
}

function resetTerriaState(viewState) {
  // Hide & reset story
  viewState.storyShown = false;
  viewState.currentStoryId = 0;
  viewState.terria.showSplitter = false;

  // Reset filtering and story viewing states
  viewState.selectedSectorName = null;
  viewState.selectedStoryID = null;
  viewState.selectedHotspot = null;
  viewState.selectedPageIndex = 0;
  viewState.selectedScenario = 0;

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

  // Reset the terria data catalog to the initial state, 
  // leaving only the base map and unfiltered hotspot Catalog group visible
  viewState.terria.catalog.group.items.forEach((item, i) => {
    if (item === receiptBaseMapCatalogItem) {
      toggleCatalogMember(item, true);
    } else if (item === hotspotCatalogGroup) {
      toggleCatalogMember(item, true);
    } else {
      toggleCatalogMember(item, false);
    }
  });

  // Deep reset the hotspots in the terria data catalog to the initial state
  getHotspotsCatalogGroup(viewState.terria.catalog)
    .items.forEach(
      function (catalogItem) {
        catalogItem.isEnabled = true;
        catalogItem.isShown = true;

        if (catalogItem.type === "geojson") {
          catalogItem._dataSource.entities.values.forEach(function (feature) {
            feature.show = true;
          });
        }
      }
    );

  viewState.terria.currentViewer.notifyRepaintRequired();
}

function getHotspotsCatalogGroup(catalog) {
  return getCatalogMemberByName(catalog, "Hotspot Overview");
}

function getSectorHotspotsList(catalog, selectedSectorName) {
  const hotspotsCatalogGroup = getHotspotsCatalogGroup(catalog)
  return hotspotsCatalogGroup.items.find(item => item.name === selectedSectorName)
    ?._dataSource.entities.values || [];
}

function getStoryHotspot(catalog, selectedSectorName, selectedStoryID) {
  const selectedHotspotsList = getSectorHotspotsList(catalog, selectedSectorName, selectedStoryID);
  return selectedHotspotsList.find(item => String(item.properties["rc-story-id"]?.getValue()) === selectedStoryID);
}

function filterHotspots(viewState, selectedSectorName, selectedStoryID) {
  const { catalog } = viewState.terria;

  getHotspotsCatalogGroup(catalog).items.forEach(function (catalogItem) {
    if (catalogItem.type === "geojson" && selectedSectorName && selectedStoryID) {
      catalogItem._dataSource.entities.values.forEach(function (feature) {
        if (catalogItem.name === selectedSectorName) {
          if (feature.properties["rc-story-id"]?.getValue().toString() === selectedStoryID) {
            feature.show = true;
          } else {
            feature.show = false;
          }
        } else {
          catalogItem.isEnabled = false;
          catalogItem.isShown = false;
        }
      });
    } else if (catalogItem.type === "geojson" && selectedSectorName) {
      if (catalogItem.name === selectedSectorName) {
        catalogItem.isEnabled = true;
        catalogItem.isShown = true;
      } else {
        catalogItem.isEnabled = false;
        catalogItem.isShown = false;
      }
    } else if (catalogItem.type === "geojson") {
      catalogItem.isEnabled = true;
      catalogItem.isShown = true;
    }
  });

  viewState.terria.currentViewer.notifyRepaintRequired();
}

function setSelectedStory(params, viewState) {
  // console.log(`setSelectedStory called`);

  // Remove the old entries from the terria stories array (the pages)
  viewState.terria.stories = [];

  var group = getStoryCatalogGroup(
    viewState.terria.catalog,
    params.storyID
  );

  // console.log(`setSelectedStory group`, group);

  var promise = null;
  if (group) {
    toggleCatalogMember(group, true);
    promise = Promise.resolve('Success');
  } else {
    const storyUrl = getLinkToStoryJSONFromParams(params, viewState.terria);
    promise = loadTerriaDataFromJSON(storyUrl, viewState.terria).then(() => {
      viewState.storyBuilderShown = false;
      viewState.storyShown = true;
      setTimeout(function () {
        triggerResize();
      }, 10);
    });
  }

  viewState.terria.currentViewer.notifyRepaintRequired();
  return promise;
}

function loadTerriaDataFromJSON(dataURL, terria) {
  const hashProperties = { share: dataURL, playStory: "1" }; // playStory is the pagenumber?

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

function getLinkToStoryJSONFromParams(params, terria) {
  // TODO: load the proper path when in production
  const serve_path = "/public/html/stories"; // || terria.configParameters.s3_url;
  let path_to_story = "";

  if (params.storyID && params.microstoryID) {
    const padded_storynum = String(params.storyID).padStart(3, "0");
    const padded_microstorynum = String(params.microstoryID).padStart(3, "0");
    path_to_story = `${serve_path}/story_${padded_storynum}/microstory_${padded_microstorynum}_initfile.json`;
  }

  if (params.storyID && !params.microstoryID) {
    const padded_storynum = String(params.storyID).padStart(3, "0");
    path_to_story = `${serve_path}/story_${padded_storynum}/story_${padded_storynum}_initfile.json`;
  }
  return path_to_story;
}

function getStoryCatalogGroup(catalog, storyID) {
  //TODO: 00x? -> just use the story id in the group name?
  var story_group_name = `Story ${String(storyID).padStart(3, '0')} data`;
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

module.exports = {
  setSelectedStory,
  loadInitialTerriaState,
  resetTerriaState,
  filterHotspots,
  getHotspotsCatalogGroup,
  getSectorHotspotsList,
  getStoryHotspot,
  activateStory
};
