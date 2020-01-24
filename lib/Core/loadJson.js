const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadJson(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchJson();
}

module.exports = loadJson;
