import makeRealPromise from "./makeRealPromise";
import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadJson(
  urlOrResource: any,
  headers?: any
): Promise<any> {
  if (urlOrResource instanceof Resource) {
    return makeRealPromise<string>(urlOrResource.fetchJson());
  }
  const jsonPromise = Resource.fetchJson({
    url: urlOrResource,
    headers: headers
  });
  return makeRealPromise<string>(jsonPromise);
}
