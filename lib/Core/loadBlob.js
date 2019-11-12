const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadBlob(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchBlob();
}

module.exports = loadBlob;
