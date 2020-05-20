var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Open Story from the popup
 * @param features
 */
const launchStory = storyId => {
  console.log("story-id:", features[0].properties["story-id"].valueOf());
  //TODO handle multiple properties when multiple features are clicked at the same time (hotspot+line)
  const hashProperties = {
    share: features[0].properties["story-id"].valueOf(),
    playStory: "1"
  };
  this.selectedFeature = features[0];
  const temporaryInitSources = [];

  // this is the on which opens the story

  interpretHash(
    this,
    hashProperties,
    this.userProperties,
    this.initSources,
    temporaryInitSources
  ).then(() => {
    loadInitSources(this, temporaryInitSources);
  });
};

function initialize(terria) {
  knockout.defineProperty(terria, "pickedFeatures", {
    get: () => {
      return terria._pickedFeatures;
    },
    set: value => {
      console.log("🎹", value);

      terria._pickedFeatures = value;
      if (value.features) {
        launchStory(value.features);
      }
    }
  });

  return "OKE";
}

module.exports = {
  initialize,
  launchStory
};
