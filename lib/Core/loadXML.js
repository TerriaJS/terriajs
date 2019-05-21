const Resource = require("terriajs-cesium/Source/Core/Resource");

function loadXML(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchXML();
}

module.exports = loadXML;
