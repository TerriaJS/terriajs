import TerriaError from "./TerriaError";

// const defaultValue =
//   require("terriajs-cesium/Source/Core/defaultValue").default;
const Resource = require("terriajs-cesium/Source/Core/Resource").default;

function loadWithXhr(options) {
  // Take advantage that most parameters are the same
  var resource = new Resource(options);

  if (options.method !== "GET") {
    throw new TerriaError({
      title: "HTTP Method not supported",
      message: `HTTP Method ${options.method} is not supported in Terria Product`
    });
  }

  return resource._makeRequest({
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    method: "GET",
    // method: defaultValue(options.method, "GET"),
    data: options.data
  });
}

Object.defineProperties(loadWithXhr, {
  load: {
    get: function () {
      return Resource._Implementations.loadWithXhr;
    },
    set: function (value) {
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function () {
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});

export default loadWithXhr;
