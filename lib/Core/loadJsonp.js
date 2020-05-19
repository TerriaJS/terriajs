const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadJsonp(urlOrResource, callbackParameterName) {
  var resource = Resource.createIfNeeded(urlOrResource);
  return resource.fetchJsonp(callbackParameterName);
}

Object.defineProperties(loadJsonp, {
  loadAndExecuteScript: {
    get: function() {
      return Resource._Implementations.loadAndExecuteScript;
    },
    set: function(value) {
      Resource._Implementations.loadAndExecuteScript = value;
    }
  },

  defaultLoadAndExecuteScript: {
    get: function() {
      return Resource._DefaultImplementations.loadAndExecuteScript;
    }
  }
});

module.exports = loadJsonp;
