import { Resource as Resource } from "cesium";

export default function loadArrayBuffer(
  urlOrResource: string,
  headers?: any
): Promise<ArrayBuffer> {
  return Resource.fetchArrayBuffer({ url: urlOrResource, headers: headers })!;
}

