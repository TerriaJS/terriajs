const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadArrayBuffer(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchArrayBuffer();
}

module.exports = loadArrayBuffer;
