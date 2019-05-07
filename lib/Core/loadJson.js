const Resource = require("terriajs-cesium/Source/Core/Resource");

function loadJson(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchJson();
}

module.exports = loadJson;
