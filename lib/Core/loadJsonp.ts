import Resource from "terriajs-cesium/Source/Core/Resource";

export function loadJsonp(
  urlOrResource: Resource,
  callbackParameterName: string
): Promise<any> {
  const resource =
    typeof urlOrResource === "string"
      ? new Resource({ url: urlOrResource })
      : urlOrResource;

  return resource.fetchJsonp(callbackParameterName)!;
}

Object.defineProperties(loadJsonp, {
  loadAndExecuteScript: {
    get: function () {
      return (Resource as any)._Implementations.loadAndExecuteScript;
    },
    set: function (value) {
      (Resource as any)._Implementations.loadAndExecuteScript = value;
    }
  },

  defaultLoadAndExecuteScript: {
    get: function () {
      return (Resource as any)._DefaultImplementations.loadAndExecuteScript;
    }
  }
});
