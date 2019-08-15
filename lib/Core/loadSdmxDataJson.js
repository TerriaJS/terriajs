const Resource = require("terriajs-cesium/Source/Core/Resource");

function loadSdmxDataJson(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetch({
    responseType: "json",
    headers: {
      Accept: "application/vnd.sdmx.data+json; version=1.0; charset=utf-8"
    }
  });
}

module.exports = loadSdmxDataJson;
