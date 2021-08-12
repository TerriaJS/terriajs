const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadText(urlOrResource, headers) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchText({
    headers: headers
  });
}

module.exports = loadText;
