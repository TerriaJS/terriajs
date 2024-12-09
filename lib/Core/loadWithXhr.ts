import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Resource from "terriajs-cesium/Source/Core/Resource";

function loadWithXhr(options: any) {
  // Take advantage that most parameters are the same
  const resource = new Resource(options);

  // @ts-expect-error TS(2339)
  return resource._makeRequest({
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    method: defaultValue(options.method, "GET"),
    data: options.data
  });
}

Object.defineProperties(loadWithXhr, {
  load: {
    get: function () {
      // @ts-expect-error TS(2339)
      return Resource._Implementations.loadWithXhr;
    },
    set: function (value) {
      // @ts-expect-error TS(2339)
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function () {
      // @ts-expect-error TS(2339)
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});

export default loadWithXhr;
