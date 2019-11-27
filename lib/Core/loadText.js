const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadText(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchText();
}

module.exports = loadText;
