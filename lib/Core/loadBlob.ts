import makeRealPromise from "./makeRealPromise";
import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadBlob(
  urlOrResource: string,
  headers?: any,
  body?: any
): Promise<Blob> {
  if (body !== undefined) {
    return makeRealPromise(
      Resource.post({
        url: urlOrResource,
        headers: headers,
        data: JSON.stringify(body),
        responseType: "blob"
      })
    );
  } else {
    return makeRealPromise(
      Resource.fetchBlob({ url: urlOrResource, headers: headers })
    );
  }
}

module.exports = loadBlob;
