
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
  viewState.storyShown = false;
  terria.currentViewer.notifyRepaintRequired();
}

module.exports = {
  launchStory,
  exitStory
};
