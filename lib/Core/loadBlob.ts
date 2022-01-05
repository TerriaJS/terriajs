import Resource from "terriajs-cesium/Source/Core/Resource";
import JsonValue from "./Json";
import loadJson from "./loadJson";
import makeRealPromise from "./makeRealPromise";

const zip = require("terriajs-cesium/Source/ThirdParty/zip").default;

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

export function isJson(uri: string) {
  return /(\.geojson)|(\.json)\b/i.test(uri);
}

export function isZip(uri: string) {
  return /(\.zip\b)/i.test(uri);
}

/** Parse zipped blob into JsonValue */
export function parseZipJsonBlob(blob: Blob): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    zip.createReader(
      new zip.BlobReader(blob),
      function(reader: any) {
        // Look for a file with a .geojson extension.
        reader.getEntries(function(entries: any) {
          let resolved = false;
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (isJson(entry.filename)) {
              entry.getData(new zip.Data64URIWriter(), function(uri: string) {
                resolve(loadJson(uri));
              });
              resolved = true;
            }
          }
          if (!resolved) {
            reject();
          }
        });
      },
      (e: Error) => reject(e)
    );
  });
}
