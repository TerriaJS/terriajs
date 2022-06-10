const defaultValue = require("terriajs-cesium/Source/Core/defaultValue")
  .default;
const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadWithXhr(options) {
  // Take advantage that most parameters are the same
  var resource = new Resource(options);

  return resource._makeRequest({
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    method: defaultValue(options.method, "GET"),
    data: options.data
  });
}

Object.defineProperties(loadWithXhr, {
  load: {
    get: function() {
      return Resource._Implementations.loadWithXhr;
    },
    set: function(value) {
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function() {
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});

module.exports = loadWithXhr;
