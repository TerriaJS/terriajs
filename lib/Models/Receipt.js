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
  // Hide story
  viewState.storyShown = false;
  terria.currentViewer.notifyRepaintRequired();

  // Enable original catalog items
  terria.nowViewing.items.forEach(item => {
    const doShow =
      item.name === "EU Lines!- Mapbox Style" ||
      item.name === "Hotspots overview";
    item.isEnabled = doShow;
    item.isShown = doShow;
  });

  // Reset camera
  terria.currentViewer.zoomTo(terria.homeView, 0.0);
}

module.exports = {
  launchStory,
  exitStory
};
