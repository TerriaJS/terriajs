import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadJson<T = any>(
  urlOrResource: any,
  headers?: any
): Promise<T> {
  return urlOrResource instanceof Resource
    ? urlOrResource.fetchJson()!
    : Resource.fetchJson({
        url: urlOrResource,
        headers: headers
      })!;
}
