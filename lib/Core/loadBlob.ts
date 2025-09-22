import Resource from "terriajs-cesium/Source/Core/Resource";
import JsonValue from "./Json";
import loadJson from "./loadJson";
import {
  ZipReader,
  BlobReader as ZipBlobReader,
  Data64URIWriter as ZipData64URIWriter,
  Uint8ArrayWriter as ZipUint8ArrayWriter
} from "@zip.js/zip.js";

type ZipEntries =
  | {
      isDirectory: true;
      fileName: string;
    }
  | {
      isDirectory: false;
      fileName: string;
      data: Uint8Array<ArrayBuffer>;
    };

export default function loadBlob(
  urlOrResource: string,
  headers?: any,
  body?: any
): Promise<Blob> {
  if (body !== undefined) {
    return Resource.post({
      url: urlOrResource,
      headers: headers,
      data: JSON.stringify(body),
      responseType: "blob"
    })!;
  } else {
    return Resource.fetchBlob({ url: urlOrResource, headers: headers })!;
  }
}

export function isJson(uri: string) {
  return /(\.geojson)|(\.json)\b/i.test(uri);
}

export function isZip(uri: string) {
  return /(\.zip\b)/i.test(uri);
}

/** Get zipjs ZipReader for given Blob */
function getZipReader(blob: Blob) {
  return new ZipReader(new ZipBlobReader(blob));
}

/** Parse zipped blob into JsonValue */
export async function parseZipJsonBlob(blob: Blob): Promise<JsonValue> {
  const reader = getZipReader(blob);

  return reader.getEntries().then(function (entries: any) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (isJson(entry.filename)) {
        return entry
          .getData(new ZipData64URIWriter())
          .then(function (uri: string) {
            return loadJson(uri);
          });
      }
    }
    return undefined;
  });
}

/** Parse zip Blob and return array of files (as UInt8Array) */
export async function parseZipArrayBuffers(blob: Blob): Promise<ZipEntries[]> {
  const reader = getZipReader(blob);

  const entries = await reader.getEntries();

  return await Promise.all(
    entries.map(async (entry) => {
      return entry.directory
        ? { fileName: entry.filename, isDirectory: true }
        : {
            fileName: entry.filename,
            isDirectory: false,
            data: await entry.getData(new ZipUint8ArrayWriter())
          };
    })
  );
}
