/**
 * Open Story from the popup
 * @param features
 */
function launchStory(storyId, terria) {
  //TODO handle multiple properties when multiple features are clicked at the same time (hotspot+line)
  const hashProperties = {
    share: storyId,
    playStory: "1"
  };

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
  terria.currentViewer.zoomTo(terria.homeView, 0.0);
}

function getHotspotsCatalogItems(terria) {
  const hotspotsCatalogGroup = terria.catalog.group.items.find(item => {
    return item.name === "Hotspot Overview";
  });
  return hotspotsCatalogGroup.items;
}

module.exports = {
  launchStory,
  exitStory
};
