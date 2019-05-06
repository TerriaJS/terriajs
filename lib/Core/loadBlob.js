const Resource = require("terriajs-cesium/Source/Core/Resource");

function loadBlob(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchBlob();
}

module.exports = loadBlob;
