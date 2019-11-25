const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadSdmxStructureJson(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetch({
    responseType: "json",
    headers: {
      Accept: "application/vnd.sdmx.structure+json; version=1.0; charset=utf-8"
    }
  });
}

module.exports = loadSdmxStructureJson;
