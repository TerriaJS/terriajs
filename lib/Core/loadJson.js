const Resource = require("terriajs-cesium/Source/Core/Resource");
const makeRealPromise = require("./makeRealPromise").default;

function loadJson(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return makeRealPromise(resource.fetchJson());
}

module.exports = loadJson;
