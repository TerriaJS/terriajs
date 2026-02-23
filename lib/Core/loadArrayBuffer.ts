import { Resource } from "terriajs-cesium";

export default function loadArrayBuffer(
  urlOrResource: string,
  headers?: any
): Promise<ArrayBuffer> {
  return Resource.fetchArrayBuffer({ url: urlOrResource, headers: headers })!;
}
