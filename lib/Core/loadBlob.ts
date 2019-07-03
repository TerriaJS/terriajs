import makeRealPromise from "./makeRealPromise";
import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadBlob(
  urlOrResource: string,
  headers: any
): Promise<Blob> {
  return makeRealPromise(
    Resource.fetchBlob({ url: urlOrResource, headers: headers })
  );
}

module.exports = loadBlob;
